import React, { useRef } from 'react';

import { Container } from './styles';

import LoginForm from '../../components/LoginForm';

export default function UseRef() {
  const refForm = useRef(null);
  const refInput1 = useRef(null);
  const refInput2 = useRef(null);
  const refButton = useRef(null);

  function submit(e) {
    e.preventDefault();
    console.log('refInput1', refInput1.current, refInput1.current.value);
    console.log('refInput2', refInput2.current, refInput2.current.value);
    console.log('refButton', refButton.current);
    console.log('refForm', refForm.current);
  }

  // useEffect(() => {
  //   console.log('refInput1', refInput1.current);
  //   console.log('refInput2', refInput2.current);
  //   console.log('refButton', refButton.current);
  //   console.log('refForm', refForm.current);
  // }, []);

  return (
    <Container>
      <h1> Show your console </h1>
      <LoginForm
        submit={submit}
        ref={{ refInput1, refInput2, refButton, refForm }}
      />
    </Container>
  );
}
