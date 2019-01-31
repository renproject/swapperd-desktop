import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { hot } from 'react-hot-loader';
import Home from '../Home';
import Settings from '../Settings';


import { createGlobalStyle } from 'styled-components';
import {
  colors,
  fonts
} from '../../styles/theme';

const GlobalStyles = createGlobalStyle`
  :root {
    font-size: 14px;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    color: ${colors.darkText};
    font-family: ${fonts.base};
    font-weight: 300;
    letter-spacing: 0.1px;
  }
`;


const App = () => (
  <div>
    <GlobalStyles />
    <Switch>
      <Route path="/settings" component={Settings} />
      <Route path="/" component={Home} />
    </Switch>
  </div>
);

export default hot(module)(App);
