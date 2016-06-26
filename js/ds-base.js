(function() {
  // jscs:disable
  /**
  * This module provides the core functionality.
  * @module ds-base
  */
  // jscs:enable
  'use strict';
  var _base;
  var _user;
  var _repo;
  var service = {};
  service.setBase = setBase;
  service.addAdminTools = addAdminTools;
  service.login = login;
  service.logout = logout;
  service.authenticated = authenticated;
  service.downloadObject = downloadObject;
  service.uploadObject = uploadObject;
  service.uploadFile = uploadFile;
  service.remove = remove;
  // jscs:disable
  /**
  * This object provides the base functionality on the window object.
  * @class ds
  * @static
  */
  // jscs:enable
  window.ds = service;
  // jscs:disable
  /**
  * This function is used to set the base URI for the ds service.
  * @method setBase
  * @static
  * @param base {String} The URI.
  * @param user {String} The GIT user.
  * @param repo {String} The GIT repo.
  */
  // jscs:enable
  function setBase(base, user, repo) {
    if (base === undefined || typeof base !== 'string') {
      throw 400;
    }
    if (user === undefined || typeof user !== 'string') {
      throw 400;
    }
    if (repo === undefined || typeof repo !== 'string') {
      throw 400;
    }
    _base = base;
    _user = user;
    _repo = repo;
  }
  // jscs:disable
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
  // jscs:enable
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
  // jscs:disable
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
  // jscs:enable
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
      if (xmlhttp.readyState === 4) {
        if (xmlhttp.status === 200) {
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
        } else {
          return callback(xmlhttp.status ? xmlhttp.status : 500);
        }
      }
    }
  }
  // jscs:disable
  /**
  * This function logs out a user.
  * @method logout
  * @static
  */
  // jscs:enable
  function logout() {
    window.localStorage.removeItem('ds_token');
    abort();
  }
  // jscs:disable
  /**
  * This function returns if authenticated.
  * @method authenticated
  * @static
  * @return {Boolean} If authenticated.
  */
  // jscs:enable
  function authenticated() {
    return window.localStorage.getItem('ds_token') !== null;
  }
  // jscs:disable
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
  // jscs:enable
  function downloadObject(filename, callback) {
    if (filename === undefined || typeof filename !== 'string') {
      throw 400;
    }
    if (callback === undefined || typeof callback !== 'function') {
      throw 400;
    }
    var xmlhttprequest = new window.XMLHttpRequest();
    xmlhttprequest.onreadystatechange = handleOnreadystatechange;
    xmlhttprequest.open('GET',
      '/upload/' + _user + '-' + _repo + '/' + filename,
      true);
    xmlhttprequest.send();
    function handleOnreadystatechange() {
      var status = xmlhttprequest.status;
      if (xmlhttprequest.readyState !== 4) {
        return;
      }
      if (status === 200) {
        try {
          callback(null, JSON.parse(xmlhttprequest.responseText));
        } catch (error) {
          callback(415, null);
        }
      } else {
        callback(status, null);
      }
    }
  }
  // jscs:disable
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
  // jscs:enable
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
    var xmlhttprequest = new window.XMLHttpRequest();
    formData.append('user', _user);
    formData.append('repo', _repo);
    formData.append('file', blob, filename);
    xmlhttprequest.open('POST',
      _base + ':3010/api/upload',
      true);
    xmlhttprequest.setRequestHeader('Authorization',
      'bearer ' + token);
    xmlhttprequest.onreadystatechange = handleOnreadystatechange;
    xmlhttprequest.send(formData);
    function handleOnreadystatechange() {
      if (xmlhttprequest.readyState !== 4) {
        return;
      }
      if (xmlhttprequest.status !== 200) {
        callback(500);
      }
      callback();
    }
  }
  // jscs:disable
  /**
  * This function uploads a file.
  * @method uploadFile
  * @static
  * @param file {Object} The file.
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
  // jscs:enable
  function uploadFile(file, callback) {
    if (file === undefined || typeof file !== 'object') {
      throw 400;
    }
    if (callback === undefined || typeof callback !== 'function') {
      throw 400;
    }
    var formData = new window.FormData();
    var token = window.localStorage.getItem('ds_token');
    var xmlhttprequest = new window.XMLHttpRequest();
    formData.append('user', _user);
    formData.append('repo', _repo);
    formData.append('file', file);
    xmlhttprequest.open('POST',
      _base + ':3010/api/upload',
      true);
    xmlhttprequest.setRequestHeader('Authorization',
      'bearer ' + token);
    xmlhttprequest.onreadystatechange = handleOnreadystatechange;
    xmlhttprequest.send(formData);
    function handleOnreadystatechange() {
      if (xmlhttprequest.readyState !== 4) {
        return;
      }
      if (xmlhttprequest.status !== 200) {
        callback(500);
      }
      callback();
    }
  }
  // jscs:disable
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
  // jscs:enable
  function remove(filename, callback) {
    if (filename === undefined || typeof filename !== 'string') {
      throw 400;
    }
    if (callback === undefined || typeof callback !== 'function') {
      throw 400;
    }
    var token = window.localStorage.getItem('ds_token');
    var xmlhttprequest = new window.XMLHttpRequest();
    xmlhttprequest.open('POST',
      _base + ':3010/api/delete',
      true);
    xmlhttprequest.setRequestHeader('Authorization',
      'bearer ' + token);
    xmlhttprequest.setRequestHeader('Content-type',
      'application/json');
    xmlhttprequest.onreadystatechange = handleOnreadystatechange;
    xmlhttprequest.send(window.JSON.stringify({
      user: _user,
      repo: _repo,
      filename: 'example.pdf'
    }));
    function handleOnreadystatechange() {
      var status = xmlhttprequest.statu;
      if (xmlhttprequest.readyState !== 4) {
        return;
      }
      if (status !== 200) {
        callback(status);
      }
      callback();
    }
  }
  function abort() {
    window.location.reload();
  }
})();
