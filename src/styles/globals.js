import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`

@import url('https://fonts.googleapis.com/css?family=Roboto:400,400i,500,500i,700,700i&display=swap');
@import url('https://fonts.googleapis.com/css?family=Rubik:300,400,700&display=swap');

* {
    margin: 0;
    padding: 0;
    outline: 0;
    box-sizing: border-box;
  };

  html, body, #root {
    height: 100%;
  };

`;

export default GlobalStyle;
