const fs = require('fs');

function mapError(e, path) {
  if (e && (e.code === 'EISDIR' || e.code === 'EPERM')) {
    const err = new Error(`EINVAL: invalid argument, readlink '${path}'`);
    err.code = 'EINVAL';
    err.errno = -4071;
    err.syscall = 'readlink';
    err.path = path;
    return err;
  }
  return e;
}

if (fs.readlink) {
  const origReadlink = fs.readlink;
  fs.readlink = function(path, opt, cb) {
    if (typeof opt === 'function') {
      cb = opt;
      opt = null;
    }
    return origReadlink.call(fs, path, opt, (err, linkString) => {
      if (err) return cb(mapError(err, path));
      return cb(null, linkString);
    });
  };
}

if (fs.readlinkSync) {
  const origReadlinkSync = fs.readlinkSync;
  fs.readlinkSync = function(path, opt) {
    try {
      return origReadlinkSync.call(fs, path, opt);
    } catch (e) {
      throw mapError(e, path);
    }
  };
}

if (fs.promises && fs.promises.readlink) {
  const origPromisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function(path, opt) {
    try {
      return await origPromisesReadlink.call(fs.promises, path, opt);
    } catch (e) {
      throw mapError(e, path);
    }
  };
}
