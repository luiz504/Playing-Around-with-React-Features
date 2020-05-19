import React from 'react';
import { Switch, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';

import UseRef from './pages/UseRef';
import ChildrenWithProps from './pages/ChildrenWithProps';

export default function Routes() {
  return (
    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route path="/useRef" component={UseRef} />
      <Route path="/childrenWithProps" component={ChildrenWithProps} />
    </Switch>
  );
}
