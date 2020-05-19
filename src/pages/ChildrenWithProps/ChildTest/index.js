import React, { Children, isValidElement, cloneElement } from 'react';
import PropTypes from 'prop-types';

// import { Container } from './styles';

export default function ChildTest({ children, ...rest }) {
  const childrenWithProps = Children.map(children, (child) => {
    console.log('children', children);
    if (isValidElement(child)) {
      return cloneElement(child, rest);
    }
    return undefined;
  });

  return <div>{childrenWithProps}</div>;
}
ChildTest.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  handleIsOpen: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
};

ChildTest.defaultProps = {
  children: undefined,
};
