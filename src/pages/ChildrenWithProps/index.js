import React from 'react';

import { Container } from './styles';
import ChildTest from './ChildTest';
import GranTest from './GranTest';

export default function ChildrenWithProps() {
  return (
    <Container>
      <h1> Pass some childrens Check console </h1>
      <ChildTest handleIsOpen={() => {}} isOpen>
        <GranTest />
      </ChildTest>
    </Container>
  );
}
