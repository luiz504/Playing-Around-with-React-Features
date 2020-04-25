import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;

  width: 100%;

  /* overflow: hidden; */
  position: fixed;
  top: 0;
  left: 0;
`;

export const Tooltip = styled.div`
  width: 30%;
  height: 30%;
  min-width: 300px;
  min-height: 250px;
  background: #ffffff;
  position: absolute;
  display: none;
`;

export const Content = styled.div`
  width: 100%;
`;

export const StatsControls = styled.div`
  /* > div {
    position: absolute !important;
  } */
`;

export const GuiControls = styled.div`
  .dg.a {
    margin-right: 0;
  }
  > div {
    position: absolute;
    top: 0;
    right: 0;
  }
`;

export const Menu = styled.div`
  display: flex;
  position: absolute;
  right: 0;
  bottom: 0;
`;

export const Button = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50px;
  border: 1px solid;
  cursor: pointer;
  height: 40px;
  width: 40px;
  margin-left: 5px;
  margin-right: 5px;
  margin-bottom: 5px;
  background: ${(props) => (props.color ? props.color : '#f0f2f7')};
`;
