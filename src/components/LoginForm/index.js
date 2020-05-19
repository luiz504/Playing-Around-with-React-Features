import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

import { Form } from './styles';

function LoginForm({ submit }, ref) {
  const { refInput1, refInput2, refButton, refForm } = ref;
  return (
    <Form ref={refForm} onSubmit={submit}>
      <label htmlFor="name2">
        Name:
        <input id="name2" name="name2" type="text" ref={refInput1} />
      </label>
      <label htmlFor="email">
        Email:
        <input id="email" name="email" type="text" ref={refInput2} />
      </label>
      <button ref={refButton} type="submit">
        Submit
      </button>
    </Form>
  );
}

LoginForm.propTypes = {
  submit: PropTypes.func.isRequired,
};

export default forwardRef(LoginForm);
