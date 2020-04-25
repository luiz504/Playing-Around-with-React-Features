import React, { useEffect } from 'react';
import { isMobile } from 'react-device-detect';

import * as THREE from 'three';
// import Stats from 'three/examples/jsm/libs/stats.module';
// import { GUI } from 'three/examples/jsm/libs/dat.gui.module';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader';
import { PMREMGenerator } from 'three/src/extras/PMREMGenerator';
// Post-processing and render passes:
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass';

import {
  FaFillDrip,
  FaEye,
  FaEyeSlash,
  FaArrowUp,
  FaArrowRight,
  FaUndoAlt,
} from 'react-icons/fa';

import {
  Wrapper,
  Content,
  // StatsControls,
  // GuiControls,
  Tooltip,
  Menu,
  Button,
} from './styles';

/* eslint no-console: ["error", { allow: ["warn", "error", 'log'] }] */

export default function Viewer360() {
  let renderer;
  let camera;
  let scene;
  let controls;
  // let stats;
  let mixer;
  let hdrBackground;
  // let PoIHovered = null;
  let loadedFBX;
  let object;
  // let hdrBackgroundRenderTarget;
  let currentPoint = 1;
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let intersectingObject;

  let TooltipAnchor;
  let intersectingObjects;
  const intersectableObjects = [];
  let pointsOfInterest = [];
  let cursorRing;
  let touchRing;
  let sceneWireframe;
  let composer;
  let usingAA = false;
  let hadCameraMovement = false;

  // Configuration Data:
  const heightOffset = -200; // This is a height offset that we apply to the navigation points so they map to the ground instead of the camera position
  let configurationData;
  let navigationPoints;
  const PoIs = [];
  const Points = [];
  const PointsVisuals = [];

  const params = {
    exposure: 4.5,
    antialiasing: false,
    wireframe: false,
  };

  // Manager
  const manager = new THREE.LoadingManager();
  manager.onStart = function test(url, itemsLoaded, itemsTotal) {
    console.log(
      `Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`
    );
  };
  manager.onLoad = function tes2() {
    console.log('Loading complete!');
  };
  // manager.onProgress = function test23(url, itemsLoaded, itemsTotal) {
  //   // console.log(
  //   //   `Loading file: ${url}\nLoaded ${itemsLoaded} of ${itemsTotal} files`
  //   // );
  // };
  manager.onError = function error(url) {
    console.log(`There was an error loading ${url}`); //eslint-disable-line
  };

  // Loaders
  const fbxLoader = new FBXLoader(manager);
  const jsonLoader = new THREE.FileLoader(manager);

  function load360(point, onFinish) {
    const hdrUrls = [
      navigationPoints[point].hdr.px,
      navigationPoints[point].hdr.nx,
      navigationPoints[point].hdr.py,
      navigationPoints[point].hdr.ny,
      navigationPoints[point].hdr.pz,
      navigationPoints[point].hdr.nz,
    ];

    hdrBackground = new HDRCubeTextureLoader(manager)
      .setDataType(THREE.UnsignedByteType)
      .load(hdrUrls, (cubeTexture) => {
        const pmremGenerator = new PMREMGenerator(renderer);
        pmremGenerator.fromCubemap(cubeTexture);
        pmremGenerator.dispose();
        onFinish();
      });
  }

  function onResize() {
    console.log('rezing');
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  function updateCameraPositionAndDirection(point) {
    camera.position.set(
      navigationPoints[point].position.x,
      navigationPoints[point].position.y,
      navigationPoints[point].position.z
    );
    // Let's update the target vector (where the control looks at) by using the camera direction
    const newLookingDirection = camera.getWorldDirection();
    newLookingDirection.x += navigationPoints[point].position.x;
    newLookingDirection.y += navigationPoints[point].position.y;
    newLookingDirection.z += navigationPoints[point].position.z;
    controls.target = newLookingDirection;
  }

  function loadPoint(point) {
    currentPoint = point;
    load360(point, () => {
      // On the sucessful load callback we update our camera and orbit control
      updateCameraPositionAndDirection(point);

      // Update our navigation markers
      const pointMesh = Points[point];
      Points.forEach((thisPoint) => (thisPoint.visible = true)); //eslint-disable-line
      pointMesh.visible = false;
    });
  }

  // Interactions
  function getClosestPoint(position) {
    let closestPosition = 999999;
    let bestPoint = -1;
    for (let i = 0; i < navigationPoints.length; i += 1) {
      const pointPosition = new THREE.Vector3(
        navigationPoints[i].position.x,
        navigationPoints[i].position.y,
        navigationPoints[i].position.z
      );
      const currentDistance = pointPosition.distanceTo(position);
      if (currentDistance < closestPosition) {
        closestPosition = currentDistance;
        bestPoint = i;
      }
    }
    return bestPoint;
  }

  function openPoI(markerObject) {
    // const { name } = markerObject;
    // const PoiID = name.split(':')[1];

    const tooltipDiv = document.querySelector('#cm-tooltip');
    tooltipDiv.style.display = 'block';

    TooltipAnchor = markerObject;
  }

  function closeAllPoIs() {
    const tooltipDiv = document.querySelector('#cm-tooltip');
    tooltipDiv.style.display = 'none';
    TooltipAnchor = null;
  }

  function checkForPoiHighlight() {
    PoIs.forEach((poi) => {
      if (intersectingObject) {
        if (poi.sprite === intersectingObject.object) {
          poi.sprite.scale.set(24, 24, 24);
          // PoIHovered = poi.sprite;
        } else {
          poi.sprite.scale.set(20, 20, 20);
        }
      } else {
        poi.sprite.scale.set(20, 20, 20);
      }
    });
  }

  // Events

  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    hadCameraMovement = true;
  }

  function onMouseClick() {
    if (intersectingObject && !hadCameraMovement) {
      const { name } = intersectingObject.object;

      if (name.includes('Point')) {
        closeAllPoIs();
        const idsplit = name.split(':');
        loadPoint(idsplit[1] - 1);
      } else if (name.includes('Marker')) {
        openPoI(intersectingObject.object);
      } else {
        closeAllPoIs();
        const worldPosition = intersectingObject.point;
        const closestPointToClick = getClosestPoint(worldPosition);
        if (closestPointToClick !== -1) {
          if (closestPointToClick !== currentPoint) {
            loadPoint(closestPointToClick);
          }
        }
      }
    }
  }

  function raycastToTouch(touchEvent) {
    if (touchEvent.changedTouches.length > 0) {
      mouse.x =
        (touchEvent.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.y =
        -(touchEvent.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      intersectingObjects = raycaster.intersectObjects(intersectableObjects);
      [intersectingObject] = [intersectingObjects[0]];
    }
  }

  function setTouchMarkerPosition() {
    if (touchRing) {
      if (intersectingObject) {
        if (intersectingObject.object.name.includes('Marker')) {
          return;
        }

        touchRing.material.visible = true;
        const touchPosition = intersectingObject.point;
        touchRing.position.set(
          touchPosition.x,
          touchPosition.y,
          touchPosition.z
        );
        const hitFace = intersectingObject.face;
        if (hitFace) {
          let lookAtNormal = new THREE.Vector3(0, 0, 1);
          if (!intersectingObject.object.name.includes('Point')) {
            lookAtNormal = new THREE.Vector3(
              touchPosition.x + intersectingObject.face.normal.x * 4,
              touchPosition.y + intersectingObject.face.normal.z * 4,
              touchPosition.z + intersectingObject.face.normal.y * 4
            );

            touchRing.material.color = new THREE.Color(0x283d);
            touchRing.material.opacity = 0.5;
          } else {
            lookAtNormal = new THREE.Vector3(
              touchPosition.x + 0,
              touchPosition.y + 4,
              touchPosition.z + 0
            );
            touchRing.material.color = new THREE.Color(0x1728);
            touchRing.material.opacity = 1;
          }
          touchRing.lookAt(lookAtNormal);
        }
      } else {
        touchRing.material.visible = false;
      }
    }
  }

  function onTouchStart(event) {
    event.preventDefault();
    hadCameraMovement = false;
    raycastToTouch(event);
    setTouchMarkerPosition();
  }

  function onTouchMove() {
    hadCameraMovement = true;
  }

  function onTouchEnd(event) {
    event.preventDefault();
    touchRing.material.visible = false;
    raycastToTouch(event);

    if (intersectingObject && !hadCameraMovement) {
      const { name } = intersectingObject.object;
      if (name.includes('Point')) {
        closeAllPoIs();
        const idsplit = name.split(':');
        loadPoint(idsplit[1] - 1);
      } else if (name.includes('Marker')) {
        openPoI(intersectingObject.object);
      } else {
        closeAllPoIs();
        const worldPosition = intersectingObject.point;
        const closestPointToClick = getClosestPoint(worldPosition);
        if (closestPointToClick !== -1) {
          if (closestPointToClick !== currentPoint) {
            loadPoint(closestPointToClick);
          }
        }
      }
    }
  }

  // Let's reset the camera drag
  function onMouseDown() {
    hadCameraMovement = false;
  }

  // Initis
  function initRender() {
    renderer = new THREE.WebGLRenderer({
      // antialias: true, // test luiz
      // preserveDrawingBuffer: true, // test luiz
      // alpha: true, // test luiz
    });
    renderer.setClearColor(0x000000, 0); // test luiz

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = params.exposure;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document
      .querySelector('#cm-content-environment')
      .appendChild(renderer.domElement);
    renderer.outputEncoding = THREE.GammaEncoding;

    // renderer.domElement.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);

    renderer.domElement.addEventListener('click', onMouseClick, true);
    renderer.domElement.addEventListener('mousedown', onMouseDown, true);

    renderer.domElement.addEventListener('touchmove', onTouchMove, false);

    renderer.domElement.addEventListener('touchstart', onTouchStart, true);
    renderer.domElement.addEventListener('touchend', onTouchEnd, true);
    window.addEventListener('resize', onResize, true);

    composer = new EffectComposer(renderer);
    composer.renderToScreen = true;
  }

  function applyBaseTransformations(obj) {
    obj.rotation.y = -Math.PI;
    obj.rotation.x = Math.PI / 2;
    obj.position.set(-2647.599365, -970, -1406.37561);
  }

  // Post Process
  function applyAntiAliasing() {
    const aaPass = new SSAARenderPass(scene, camera);
    composer.addPass(aaPass);
  }

  function applyRenderPass() {
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
  }

  function initSceneColliders(url) {
    fbxLoader.load(url, (obj) => {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.5,
            roughness: 0.5,
            side: THREE.FrontSide,
            visible: false,
          });

          // This is the true collider used for mouse interactivitiy
          scene.add(child);
          intersectableObjects.push(child);
          applyBaseTransformations(child);

          // Creating the wireframe representation of the collision meshes so we can inspect it better
          const wireframe = new THREE.WireframeGeometry(child.geometry);
          sceneWireframe = new THREE.LineSegments(wireframe);
          sceneWireframe.material.depthTest = false;
          sceneWireframe.material.opacity = 0.45;
          sceneWireframe.material.transparent = true;
          scene.add(sceneWireframe);

          applyBaseTransformations(sceneWireframe);
        }
      });
    });
  }

  function initCamera() {
    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      100000
    );
  }

  function createPoI(data) {
    const poi = {};

    // This is the PoI Sprite
    const spriteTint = new THREE.Color(data.color);
    const spriteMap = new THREE.TextureLoader().load('/textures/marker.png');
    const spriteMaterial = new THREE.SpriteMaterial({
      map: spriteMap,
      color: spriteTint,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.name = `Marker:${data._id}`;
    poi.sprite = sprite;

    intersectableObjects.push(sprite);
    scene.add(sprite);
    sprite.position.set(
      data.markerPosition.x,
      data.markerPosition.y,
      data.markerPosition.z
    );
    sprite.scale.set(20, 20, 20);

    // This is the PoI Line
    const lineStartPosition = new THREE.Vector3(
      data.lineStartPosition.x,
      data.lineStartPosition.y,
      data.lineStartPosition.z
    );
    const lineEndPositionPosition = new THREE.Vector3(
      data.markerPosition.x,
      data.markerPosition.y,
      data.markerPosition.z
    );
    const lineMaterial = new THREE.LineBasicMaterial({
      color: spriteTint,
    });
    const points = [lineStartPosition, lineEndPositionPosition];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMesh = new THREE.Line(lineGeo, lineMaterial);
    poi.line = lineMesh;

    PoIs.push(poi);
    scene.add(lineMesh);
  }

  function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c111a);

    // Initialize Navigation Points
    for (let i = 0; i < navigationPoints.length; i += 1) {
      const markerGeo = new THREE.BoxGeometry(100, 20, 100);
      const material = new THREE.MeshBasicMaterial({
        color: 0x0000ffa,
        side: THREE.FrontSide,
        visible: false,
      });
      const markerMesh = new THREE.Mesh(markerGeo, material);
      markerMesh.name = `Point:${i + 1}`;
      const PositionToAdd = navigationPoints[i].position;
      markerMesh.position.set(
        PositionToAdd.x,
        PositionToAdd.y + heightOffset + 10,
        PositionToAdd.z
      );

      Points[i] = markerMesh;
      intersectableObjects.push(markerMesh);
      scene.add(markerMesh);

      // This is the actual visual representation
      const visualGeo = new THREE.RingGeometry(15, 20, 32);
      const visualMaterial = new THREE.MeshBasicMaterial({
        color: 0x283d,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const visualMesh = new THREE.Mesh(visualGeo, visualMaterial);
      visualMesh.name = `VisualMarker:${i + 1}`;
      visualMesh.position.set(
        markerMesh.position.x,
        markerMesh.position.y,
        markerMesh.position.z
      );
      visualMesh.rotation.x = THREE.MathUtils.degToRad(90);
      PointsVisuals[i] = visualMesh;
      scene.add(visualMesh);
    }

    // Initializing the Points of Interest
    pointsOfInterest.forEach((poi) => {
      createPoI(poi);
    });

    const light = new THREE.HemisphereLight(0xbbbbff, 0x444422);
    light.position.set(0, 1, 0);
    scene.add(light);

    // Initialize scene collisions
    initSceneColliders(configurationData.colider);
  }

  function updateCursorMarker() {
    if (cursorRing) {
      if (intersectingObject) {
        // If we're intersecting a Point of interest, let's hide our cursor ring
        if (intersectingObject.object.name.includes('Marker')) {
          cursorRing.material.visible = false;
        } else {
          cursorRing.material.visible = true;
        }

        const cursorPosition = intersectingObject.point;
        cursorRing.position.set(
          cursorPosition.x,
          cursorPosition.y,
          cursorPosition.z
        );
        const hitFace = intersectingObject.face;
        if (hitFace) {
          let lookAtNormal = new THREE.Vector3(0, 0, 1);
          if (!intersectingObject.object.name.includes('Point')) {
            lookAtNormal = new THREE.Vector3(
              cursorPosition.x + intersectingObject.face.normal.x * 4,
              cursorPosition.y + intersectingObject.face.normal.z * 4,
              cursorPosition.z + intersectingObject.face.normal.y * 4
            );

            cursorRing.material.color = new THREE.Color(0x283d);
            cursorRing.material.opacity = 0.5;
          } else {
            lookAtNormal = new THREE.Vector3(
              cursorPosition.x + 0,
              cursorPosition.y + 4,
              cursorPosition.z + 0
            );
            cursorRing.material.color = new THREE.Color(0x1728);
            cursorRing.material.opacity = 1;
          }
          cursorRing.lookAt(lookAtNormal);
        }
      } else {
        cursorRing.material.visible = false;
      }
    }
  }

  function toScreenPosition(obj) {
    const vector = new THREE.Vector3();

    const widthHalf = 0.5 * window.innerWidth;
    const heightHalf = 0.5 * window.innerHeight;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = vector.x * widthHalf + widthHalf;
    vector.y = vector.y * heightHalf + heightHalf;

    return {
      x: vector.x,
      y: vector.y,
    };
  }

  function updateTooltipPosition() {
    const tooltipDiv = document.querySelector('#cm-tooltip');
    const tooltipScreenPos = toScreenPosition(TooltipAnchor);
    tooltipDiv.style.left = `${tooltipScreenPos.x}px`;
    tooltipDiv.style.bottom = `${tooltipScreenPos.y}px`;
  }

  function render() {
    scene.background = hdrBackground;

    if (!isMobile) {
      // update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      // calculate objects intersecting the picking ray var intersects =
      intersectingObjects = raycaster.intersectObjects(intersectableObjects);
      [intersectingObject] = [intersectingObjects[0]];
      updateCursorMarker();
    }
    if (TooltipAnchor) {
      updateTooltipPosition();
    }
    checkForPoiHighlight();
    // To change the color of the marker on the ground
    // if(intersectingObject){
    //   const { name } = intersectingObject.object;
    //   if(name.includes("Point")){
    //     let pointId = name.split(':')[1];
    //     let targetMaterial = PointsVisuals[pointId-1].material;
    //     targetMaterial.color = new THREE.Color(0xff0000);
    //   }else{
    //     PointsVisuals.forEach((currentMarkerVisual) => {
    //       let targetMaterial = currentMarkerVisual.material;
    //     targetMaterial.color = new THREE.Color(0x283d);
    //     });
    //   }
    // }

    if (sceneWireframe != null) {
      if (params.wireframe) {
        sceneWireframe.material.opacity = 0.45;
      } else {
        sceneWireframe.material.opacity = 0;
      }

      sceneWireframe.material.needsUpdate = true;
    }

    if (params.antialiasing) {
      if (!usingAA) {
        applyAntiAliasing();
        usingAA = true;
      }
    } else if (usingAA) {
      composer = new EffectComposer(renderer);
      applyRenderPass();
      usingAA = false;
    }
    renderer.toneMappingExposure = params.exposure;
  }

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    // stats.begin();
    render();
    composer.render();
    controls.update();
    // stats.end();
  }

  function initControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 0;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.dampingFactor = 0.25;
    controls.rotateSpeed = -0.2;

    const orbitLookDirection = new THREE.Vector3(0, 0, 200);
    controls.target = orbitLookDirection;

    // const gui = new GUI();
    // gui.add(params, "exposure", 0, 10, 0.01);
    // gui.add(params, "antialiasing", false);
    // gui.add(params, "wireframe", true);
    // document.querySelector("#cm-gui-environment").appendChild(gui.domElement);
    // gui.open();

    // Create Status Bar
    // stats = new Stats();
    // document.querySelector("#cm-stats-environment").appendChild(stats.dom);
    animate();
  }

  function initCursorMarker() {
    const cursorRingMesh = new THREE.RingGeometry(15, 20, 32);
    const cursorRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x283d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });

    cursorRing = new THREE.Mesh(cursorRingMesh, cursorRingMaterial);
    scene.add(cursorRing);
  }

  function initTouchMarker() {
    const cursorRingMesh = new THREE.RingGeometry(5, 10, 32);
    const cursorRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x283d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      visible: false,
    });

    touchRing = new THREE.Mesh(cursorRingMesh, cursorRingMaterial);
    scene.add(touchRing);
  }

  // This applies the based transformations from UE4 transforms to our navigation point 0 origin

  // initilization fuction
  function init() {
    // Read config Data
    jsonLoader.load(
      '/viewerData.json',

      (loadedData) => {
        // Add the loaded json data
        configurationData = JSON.parse(loadedData);
        navigationPoints = configurationData.navigation.points;
        pointsOfInterest = configurationData.points;

        initRender();
        initCamera();
        initScene();
        initControls();
        loadPoint(0);
        if (!isMobile) {
          initCursorMarker();
        } else {
          initTouchMarker();
        }

        fbxLoader.load(
          'https://3d-threejs-viewer.s3.eu-central-1.amazonaws.com/XSMODULE04MESH.FBX',
          (obj) => {
            object = obj;
            object.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xe59c00,
                  metalness: params.metalness,
                  roughness: params.roughness,
                  side: THREE.DoubleSide,
                });
                loadedFBX = child;
                loadedFBX.geometry.computeBoundingSphere();
              }
            });
            object.position.set(20, -23, 38);
            object.rotation.x = Math.PI * 0.5;
            object.rotation.z = Math.PI * 0.5;
            scene.add(object);
          }
        );

        controls.update();
        // //Post processing stack:
        applyRenderPass();
      }
    );
  }

  useEffect(() => {
    init();
  });

  return (
    <>
      <Wrapper id="cm-content-environment">
        <Content id="cm-content-environment" />
        {/* <StatsControls id="cm-stats-environment" />
        <GuiControls id="cm-gui-environment" /> */}
        <Tooltip id="cm-tooltip">
          <iframe
            title="iframe"
            style={{ width: '100%', height: '100%' }}
            src="https://monitoring-stack.xsensors.ai/d/nLA1wBPWz/ainda-statistics?panelId=6&fullscreen&orgId=2"
          />
        </Tooltip>
        <Menu>
          <Button
            color="#ff0000"
            onClick={() => object.children[0].material.color.set(0xff0000)}
          >
            <FaFillDrip />
          </Button>
          <Button
            color="#e59c00"
            onClick={() => object.children[0].material.color.set(0xe59c00)}
          >
            <FaFillDrip />
          </Button>
          <Button
            onClick={() => {
              object.position.set(0, 0, 20);
              object.rotation.x = 0;
              object.rotation.y = 0;
              object.rotation.z = 0;
            }}
          >
            <FaEye />
          </Button>
          <Button
            onClick={() => {
              object.position.set(20, -23, 38);
              object.rotation.x = Math.PI * 0.5;
              object.rotation.y = 0;
              object.rotation.z = Math.PI * 0.5;
            }}
          >
            <FaEyeSlash />
          </Button>
          <Button
            onClick={() => {
              object.rotation.x += Math.PI * 0.3;
            }}
          >
            <FaArrowUp />
          </Button>
          <Button
            onClick={() => {
              object.rotation.y += Math.PI * 0.3;
            }}
          >
            <FaArrowRight />
          </Button>
          <Button
            onClick={() => {
              object.rotation.z += Math.PI * 0.3;
            }}
          >
            <FaUndoAlt />
          </Button>
        </Menu>
      </Wrapper>
    </>
  );
}
