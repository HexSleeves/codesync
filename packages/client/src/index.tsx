/**
 * Client entry point - renders the App using Hono JSX-DOM
 */

import { render } from 'hono/jsx/dom';
import { App } from './App';
import './styles.css';

const root = document.getElementById('root');
if (root) {
  render(<App />, root);
}
