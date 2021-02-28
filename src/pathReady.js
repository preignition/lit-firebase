// import { default as FirebaseDatabase } from './lif-database-mixin.js';
/**
 * cheks whether path is a valid path
 * @param  {String} path firebase database path
 * @return {Boolean}      true if path is valid
 */
export const pathReady = (path) => {
  const split = path && path.split('/').slice(1);
  return split.indexOf('') < 0 && split.indexOf('undefined') < 0;
};

export default pathReady;
