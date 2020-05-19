import React from 'react';

import { NavLink } from 'react-router-dom';
import { Container, Title } from './styles';

export default function HomePage() {
  return (
    <Container>
      <Title>HomePage</Title>

      <ul>
        <li>
          <NavLink to="/useRef">UseRef</NavLink>
        </li>
        <li>
          <NavLink to="/childrenWithProps"> Children with Props </NavLink>
        </li>
      </ul>
    </Container>
  );
}
