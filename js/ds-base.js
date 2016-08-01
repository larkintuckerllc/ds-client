(function() {
  /**
  * This module provides the core functionality.
  * @module ds-base
  */
  'use strict';
  var _base;
  var _user;
  var _repo;
  var service = {};
  service.setBase = setBase;
  service.setRepo = setRepo;
  service.addAdminTools = addAdminTools;
  service.login = login;
  service.logout = logout;
  service.authenticated = authenticated;
  service.getToken = getToken;
  service.loginToken = loginToken;
  service.downloadObject = downloadObject;
  service.uploadObject = uploadObject;
  service.uploadFile = uploadFile;
  service.remove = remove;
  service.list = list;
  service.getServerVersions = getServerVersions;
  service.getStartup = getStartup;
  service.setStartup = setStartup;
  service.install = install;
  service.update = update;
  /**
  * This object provides the base functionality on the window object.
  * @class ds
  * @static
  */
  window.ds = service;
  /**
  * This function is used to set the base URI for the ds service.
  * @method setBase
  * @static
  * @param base {String} The URI.
  */
  function setBase(base) {
    if (base === undefined || typeof base !== 'string') {
      throw 400;
    }
    _base = base;
  }
  /**
  * This function is used to set the GIT repo for the ds service.
  * @method setRepo
  * @static
  * @param user {String} The GIT user.
  * @param repo {String} The GIT repo.
  */
  function setRepo(user, repo) {
    if (user === undefined || typeof user !== 'string') {
      throw 400;
    }
    if (repo === undefined || typeof repo !== 'string') {
      throw 400;
    }
    _user = user;
    _repo = repo;
  }
  /**
  * This function is used to add the administration tools (login, etc.) and ESC key reloads.
  * @method addAdminTools
  * @static
  * @param frameEl {Object} The frame DOM element.
  * @param loginCallback {Function} The callback function called when logged inlogged in.
  * ```
  * function()
  * ```
  */
  function addAdminTools(frameEl, loginCallback) {
    if (frameEl === undefined || typeof frameEl !== 'object') {
      throw 400;
    }
    if (loginCallback === undefined ||
      typeof loginCallback !== 'function') {
      throw 400;
    }
    if (authenticated()) {
      loginCallback();
    } else {
      addLoginTools();
    }
    function addLoginTools() {
      var loginEl = document.createElement('form');
      loginEl.id = 'ds_base_login';
      // jscs:disable
      loginEl.innerHTML = [
        '<input id="ds_base_login__username" type="text" placeholder="Username">',
        '<input id="ds_base_login__password" type="password" placeholder="Password">',
        '<button type="submit">Login</button>'
      ].join('\n');
      // jscs:enable
      loginEl.addEventListener('submit', loginElSubmit);
      frameEl.appendChild(loginEl);
      function loginElSubmit(e) {
        e.preventDefault();
        var username = loginEl
          .querySelector('#ds_base_login__username').value;
        var password = loginEl
          .querySelector('#ds_base_login__password').value;
        if (username && password) {
          login(username, password, callback);
        }
        function callback(error) {
          if (!error) {
            loginEl.style.display = 'none';
            loginCallback();
          }
        }
      }
    }
  }
  /**
  * This function logs in a user.
  * @method login
  * @static
  * @param username {String} The user's name.
  * @param password {String} The user's password.
  * @param callback {Function} The function callback.
  * ```
  * function(error)
  *
  * Parameters:
  *
  * error Integer
  * The error code; null is success.
  * ```
  */
  function login(username, password, callback) {
    if (username === undefined || typeof username !== 'string') {
      throw 400;
    }
    if (password === undefined || typeof password !== 'string') {
      throw 400;
    }
    if (callback === undefined || typeof callback !== 'function') {
      throw 400;
    }
    var ref = _base + ':3010/api/login';
    var params = 'username=' + username + '&password=' + password;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST', ref, true);
    xmlhttp.setRequestHeader('Content-type',
      'application/x-www-form-urlencoded');
    xmlhttp.onreadystatechange = onChange;
    xmlhttp.send(params);
    function onChange() {
      if (xmlhttp.readyState !== 4) {
        return;
      }
      if (xmlhttp.status !== 200) {
        return callback(xmlhttp.status ? xmlhttp.status : 500);
      }
      var token;
      try {
        token = JSON.parse(xmlhttp.responseText).token;
      } catch (error) {
        return callback(500);
      }
      if (!token) {
        return callback(500);
      }
      window.localStorage.setItem('ds_token',
        token);
      return callback(null);
    }
  }
  /**
  * This function logs out a user.
  * @method logout
  * @static
  */
  function logout() {
    window.localStorage.removeItem('ds_token');
    abort();
  }
  /**
  * This function returns if authenticated.
  * @method authenticated
  * @static
  * @return {Boolean} If authenticated.
  */
  function authenticated() {
    return window.localStorage.getItem('ds_token') !== null;
  }
  /**
  * This function returns the authentication token.
  * @method getToken
  * @static
  * @return {String} Token
  */
  function getToken() {
    return window.localStorage.getItem('ds_token');
  }
  /**
  * This function is used to login using a token.
  * @method loginToken
  * @static
  * @param token {String} The token.
  * @param loginTokenCallback {Function} The callback function.
  * ```
  * function(error)
  *
  * Parameters:
  *
  * error Integer
  * The error code; null is success.
  * ```
  **/
  function loginToken(token, loginTokenCallback) {
    if (token === undefined || typeof token !== 'string') {
      throw 400;
    }
    if (loginTokenCallback === undefined ||
      typeof loginTokenCallback !== 'function') {
      throw 400;
    }
    var ref = _base + ':3010/api/valid';
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST', ref, true);
    xmlhttp.setRequestHeader('Authorization',
      'bearer ' + token);
    xmlhttp.setRequestHeader('Content-type',
      'application/json');
    xmlhttp.onreadystatechange = handleOnreadystatechange;
    xmlhttp.send(JSON.stringify({}));
    function handleOnreadystatechange() {
      if (xmlhttp.readyState !== 4) {
        return;
      }
      if (xmlhttp.status !== 200) {
        return loginTokenCallback(xmlhttp.status ? xmlhttp.status : 500);
      }
      window.localStorage.setItem('ds_token',
        token);
      return loginTokenCallback(null);
    }
  }
  /**
  * This function downloads a JavaScript object.
  * @method downloadObject
  * @static
  * @param filename {String} The file name.
  * @param callback {Function} The function callback.
  * ```
  * function(error, object)
  *
  * Parameters:
  *
  * error Integer
  * The error code; null is success.
  *
  * object Object
  * The downloaded object.
  * ```
  */
  function downloadObject(filename, callback) {
    if (filename === undefined || typeof filename !== 'string') {
      throw 400;
    }
    if (callback === undefined || typeof callback !== 'function') {
      throw 400;
    }
    var xmlhttp = new window.XMLHttpRequest();
    xmlhttp.onreadystatechange = handleOnreadystatechange;
    xmlhttp.open('GET',
      '/upload/' + _user + '-' + _repo + '/' + filename,
      true);
    xmlhttp.send();
    function handleOnreadystatechange() {
      if (xmlhttp.readyState !== 4) {
        return;
      }
      if (xmlhttp.status !== 200) {
        return callback(xmlhttp.status ? xmlhttp.status : 500);
      }
      try {
        return callback(null, JSON.parse(xmlhttp.responseText));
      } catch (error) {
        return callback(415, null);
      }
    }
  }
  /**
  * This function uploads a JavaScript object.
  * @method uploadObject
  * @static
  * @param object {Object} The object.
  * @param filename {String} The file name.
  * @param callback {Function} The function callback.
  * ```
  * function(error)
  *
  * Parameters:
  *
  * error Integer
  * The error code; null is success.
  * ```
  */
  function uploadObject(object, filename, callback) {
    if (object === undefined || typeof object !== 'object') {
      throw 400;
    }
    if (filename === undefined || typeof filename !== 'string') {
      throw 400;
    }
    if (callback === undefined || typeof callback !== 'function') {
      throw 400;
    }
    var blob = new window.Blob(
      [window.JSON.stringify(object)],
      {type: 'application/json'}
    );
    var formData = new window.FormData();
    var token = window.localStorage.getItem('ds_token');
    var xmlhttp = new window.XMLHttpRequest();
    formData.append('user', _user);
    formData.append('repo', _repo);
    formData.append('file', blob, filename);
    xmlhttp.open('POST',
      _base + ':3010/api/upload',
      true);
    xmlhttp.setRequestHeader('Authorization',
      'bearer ' + token);
    xmlhttp.onreadystatechange = handleOnreadystatechange;
    xmlhttp.send(formData);
    function handleOnreadystatechange() {
      if (xmlhttp.readyState !== 4) {
        return;
      }
      if (xmlhttp.status !== 200) {
        return callback(xmlhttp.status ? xmlhttp.status : 500);
      }
      return callback(null);
    }
  }
  /**
  * This function uploads a file.
  * @method uploadFile
  * @static
  * @param file {Object} The file.
  * @param callback {Function} The function callback.
  * @param filename {String} Optional filename.
  * ```
  * function(error)
  *
  * Parameters:
  *
  * error Integer
  * The error code; null is success.
  * ```
  */
  function uploadFile(file, callback, filename) {
    if (file === undefined || typeof file !== 'object') {
      throw 400;
    }
    if (callback === undefined || typeof callback !== 'function') {
      throw 400;
    }
    if (filename !== undefined && typeof filename !== 'string') {
      throw 400;
    }
    var formData = new window.FormData();
    var token = window.localStorage.getItem('ds_token');
    var xmlhttp = new window.XMLHttpRequest();
    formData.append('user', _user);
    formData.append('repo', _repo);
    formData.append('file', file);
    if (filename !== undefined) {
      formData.append('filename', filename);
    }
    xmlhttp.open('POST',
      _base + ':3010/api/upload',
      true);
    xmlhttp.setRequestHeader('Authorization',
      'bearer ' + token);
    xmlhttp.onreadystatechange = handleOnreadystatechange;
    xmlhttp.send(formData);
    function handleOnreadystatechange() {
      if (xmlhttp.readyState !== 4) {
        return;
      }
      if (xmlhttp.status !== 200) {
        return callback(xmlhttp.status ? xmlhttp.status : 500);
      }
      return callback(null);
    }
  }
  /**
  * This function removes uploads.
  * @method remove
  * @static
  * @param filename {String} The file name.
  * @param callback {Function} The function callback.
  * ```
  * function(error)
  *
  * Parameters:
  *
  * error Integer
  * The error code; null is success.
  * ```
  */
  function remove(filename, callback) {
    if (filename === undefined || typeof filename !== 'string') {
      throw 400;
    }
    if (callback === undefined || typeof callback !== 'function') {
      throw 400;
    }
    var token = window.localStorage.getItem('ds_token');
    var xmlhttp = new window.XMLHttpRequest();
    xmlhttp.open('POST',
      _base + ':3010/api/delete',
      true);
    xmlhttp.setRequestHeader('Authorization',
      'bearer ' + token);
    xmlhttp.setRequestHeader('Content-type',
      'application/json');
    xmlhttp.onreadystatechange = handleOnreadystatechange;
    xmlhttp.send(window.JSON.stringify({
      user: _user,
      repo: _repo,
      filename: 'example.pdf'
    }));
    function handleOnreadystatechange() {
      if (xmlhttp.readyState !== 4) {
        return;
      }
      if (xmlhttp.status !== 200) {
        return callback(xmlhttp.status ? xmlhttp.status : 500);
      }
      return callback(null);
    }
  }
  /**
  * This function lists apps
  * @method list
  * @static
  * @param callback {Function} The function callback.
  * ```
  * function(error, apps)
  *
  * Parameters:
  *
  * error Integer
  * The error code; null is success.
  *
  * apps Array
  * The apps
  * ```
  */
  function list(callback) {
    var token = window.localStorage.getItem('ds_token');
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST', _base + ':3010/api/list', true);
    xmlhttp.setRequestHeader('Authorization',
      'bearer ' + token);
    xmlhttp.setRequestHeader('Content-type',
      'application/json');
    xmlhttp.onreadystatechange = handleOnreadystatechange;
    xmlhttp.send(JSON.stringify({}));
    function handleOnreadystatechange() {
      if (xmlhttp.readyState !== 4) {
        return;
      }
      if (xmlhttp.status !== 200) {
        return callback(xmlhttp.status ? xmlhttp.status : 500);
      }
      var apps;
      try {
        apps = JSON.parse(xmlhttp.responseText);
      } catch (error) {
        return callback(500);
      }
      return callback(null, apps);
    }
  }
  /**
  * This function lists apps
  * @method getServerVersions
  * @static
  * @param callback {Function} The function callback.
  * ```
  * function(error, serverVersions)
  *
  * Parameters:
  *
  * error Integer
  * The error code; null is success.
  *
  * apps Object
  * The server versions.
  * ```
  */
  function getServerVersions(callback) {
    var token = window.localStorage.getItem('ds_token');
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST', _base + ':3010/api/server_versions', true);
    xmlhttp.setRequestHeader('Authorization',
      'bearer ' + token);
    xmlhttp.setRequestHeader('Content-type',
      'application/json');
    xmlhttp.onreadystatechange = handleOnreadystatechange;
    xmlhttp.send(JSON.stringify({}));
    function handleOnreadystatechange() {
      if (xmlhttp.readyState !== 4) {
        return;
      }
      if (xmlhttp.status !== 200) {
        return callback(xmlhttp.status ? xmlhttp.status : 500);
      }
      try {
        return callback(null, JSON.parse(xmlhttp.responseText));
      } catch (error) {
        return callback(500);
      }
    }
  }
  /**
  * This function returns the startup Url
  * @method getStartup
  * @static
  * @param callback {Function} The function callback.
  * ```
  * function(error, url)
  *
  * Parameters:
  *
  * error Integer
  * The error code; null is success.
  *
  * startupUrl String
  * The startup Url.
  * ```
  */
  function getStartup(callback) {
    var token = window.localStorage.getItem('ds_token');
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', _base + ':3010/api/startup', true);
    xmlhttp.setRequestHeader('Authorization',
      'bearer ' + token);
    xmlhttp.onreadystatechange = handleOnreadystatechange;
    xmlhttp.send();
    function handleOnreadystatechange() {
      if (xmlhttp.readyState !== 4) {
        return;
      }
      if (xmlhttp.status !== 200) {
        return callback(xmlhttp.status ? xmlhttp.status : 500);
      }
      var startupUrl;
      try {
        startupUrl = JSON.parse(xmlhttp.responseText).startup;
      } catch (error) {
        return callback(500);
      }
      return callback(null, startupUrl);
    }
  }
  /**
  * This function returns the startup Url
  * @method setStartup
  * @static
  * @param startupUrl {String} The startup Url.
  * @param callback {Function} The function callback.
  * ```
  * function(error)
  *
  * Parameters:
  *
  * error Integer
  * The error code; null is success.
  * ```
  */
  function setStartup(startupUrl, callback) {
    var token = window.localStorage.getItem('ds_token');
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST', _base + ':3010/api/startup', true);
    xmlhttp.setRequestHeader('Authorization',
      'bearer ' + token);
    xmlhttp.setRequestHeader('Content-type',
      'application/json');
    xmlhttp.onreadystatechange = handleOnreadystatechange;
    xmlhttp.send(JSON.stringify({
      startup: startupUrl}));
    function handleOnreadystatechange() {
      if (xmlhttp.readyState !== 4) {
        return;
      }
      if (xmlhttp.status !== 200) {
        return callback(xmlhttp.status ? xmlhttp.status : 500);
      }
      return callback(null);
    }
  }
  /**
  * This function updates the app.
  * @method update
  * @static
  * @param user {String} The uses.
  * @param repo {String} The repo.
  * @param callback {Function} The function callback.
  * ```
  * function(error)
  *
  * Parameters:
  *
  * error Integer
  * The error code; null is success.
  * ```
  */
  function update(user, repo, callback) {
    var token = window.localStorage.getItem('ds_token');
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST', _base + ':3010/api/update', true);
    xmlhttp.setRequestHeader('Authorization',
      'bearer ' + token);
    xmlhttp.setRequestHeader('Content-type',
      'application/json');
    xmlhttp.onreadystatechange = handleOnreadystatechange;
    xmlhttp.send(JSON.stringify({
      user: user,
      repo: repo
    }));
    function handleOnreadystatechange() {
      if (xmlhttp.readyState !== 4) {
        return;
      }
      if (xmlhttp.status !== 200) {
        return callback(xmlhttp.status ? xmlhttp.status : 500);
      }
      return callback(null);
    }
  }
  /**
  * This function installs the app.
  * @method install
  * @static
  * @param user {String} The uses.
  * @param repo {String} The repo.
  * @param callback {Function} The function callback.
  * ```
  * function(error)
  *
  * Parameters:
  *
  * error Integer
  * The error code; null is success.
  * ```
  */
  function install(user, repo, callback) {
    var token = window.localStorage.getItem('ds_token');
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST', _base + ':3010/api/install', true);
    xmlhttp.setRequestHeader('Authorization',
      'bearer ' + token);
    xmlhttp.setRequestHeader('Content-type',
      'application/json');
    xmlhttp.onreadystatechange = handleOnreadystatechange;
    xmlhttp.send(JSON.stringify({
      user: user,
      repo: repo
    }));
    function handleOnreadystatechange() {
      if (xmlhttp.readyState !== 4) {
        return;
      }
      if (xmlhttp.status !== 200) {
        return callback(xmlhttp.status ? xmlhttp.status : 500);
      }
      return callback(null);
    }
  }
  function abort() {
    window.location.reload();
  }
})();
