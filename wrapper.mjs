import e from "/npm/@supabase/functions-js@2.86.2/+esm";
import t from "/npm/@supabase/postgrest-js@2.86.2/+esm";
import r from "/npm/@supabase/realtime-js@2.86.2/+esm";
import n from "/npm/@supabase/storage-js@2.86.2/+esm";
import s from "/npm/@supabase/auth-js@2.86.2/+esm";
function o(e, t) {
  return (
    t.forEach(function (t) {
      t &&
        "string" != typeof t &&
        !Array.isArray(t) &&
        Object.keys(t).forEach(function (r) {
          if ("default" !== r && !(r in e)) {
            var n = Object.getOwnPropertyDescriptor(t, r);
            Object.defineProperty(
              e,
              r,
              n.get
                ? n
                : {
                    enumerable: !0,
                    get: function () {
                      return t[r];
                    },
                  }
            );
          }
        });
    }),
    Object.freeze(e)
  );
}
var i =
  "undefined" != typeof global
    ? global
    : "undefined" != typeof self
    ? self
    : "undefined" != typeof window
    ? window
    : {};
function a() {
  throw new Error("setTimeout has not been defined");
}
function u() {
  throw new Error("clearTimeout has not been defined");
}
var c = a,
  l = u;
function h(e) {
  if (c === setTimeout) return setTimeout(e, 0);
  if ((c === a || !c) && setTimeout) return (c = setTimeout), setTimeout(e, 0);
  try {
    return c(e, 0);
  } catch (t) {
    try {
      return c.call(null, e, 0);
    } catch (t) {
      return c.call(this, e, 0);
    }
  }
}
"function" == typeof i.setTimeout && (c = setTimeout),
  "function" == typeof i.clearTimeout && (l = clearTimeout);
var d,
  f = [],
  p = !1,
  b = -1;
function g() {
  p &&
    d &&
    ((p = !1), d.length ? (f = d.concat(f)) : (b = -1), f.length && E());
}
function E() {
  if (!p) {
    var e = h(g);
    p = !0;
    for (var t = f.length; t; ) {
      for (d = f, f = []; ++b < t; ) d && d[b].run();
      (b = -1), (t = f.length);
    }
    (d = null),
      (p = !1),
      (function (e) {
        if (l === clearTimeout) return clearTimeout(e);
        if ((l === u || !l) && clearTimeout)
          return (l = clearTimeout), clearTimeout(e);
        try {
          return l(e);
        } catch (t) {
          try {
            return l.call(null, e);
          } catch (t) {
            return l.call(this, e);
          }
        }
      })(e);
  }
}
function m(e, t) {
  (this.fun = e), (this.array = t);
}
m.prototype.run = function () {
  this.fun.apply(null, this.array);
};
function T() {}
var v = T,
  A = T,
  _ = T,
  w = T,
  O = T,
  y = T,
  S = T;
var j = i.performance || {},
  F =
    j.now ||
    j.mozNow ||
    j.msNow ||
    j.oNow ||
    j.webkitNow ||
    function () {
      return new Date().getTime();
    };
var k = new Date();
var L = {
    nextTick: function (e) {
      var t = new Array(arguments.length - 1);
      if (arguments.length > 1)
        for (var r = 1; r < arguments.length; r++) t[r - 1] = arguments[r];
      f.push(new m(e, t)), 1 !== f.length || p || h(E);
    },
    title: "browser",
    browser: !0,
    env: {},
    argv: [],
    version: "",
    versions: {},
    on: v,
    addListener: A,
    once: _,
    off: w,
    removeListener: O,
    removeAllListeners: y,
    emit: S,
    binding: function (e) {
      throw new Error("process.binding is not supported");
    },
    cwd: function () {
      return "/";
    },
    chdir: function (e) {
      throw new Error("process.chdir is not supported");
    },
    umask: function () {
      return 0;
    },
    hrtime: function (e) {
      var t = 0.001 * F.call(j),
        r = Math.floor(t),
        n = Math.floor((t % 1) * 1e9);
      return e && ((r -= e[0]), (n -= e[1]) < 0 && (r--, (n += 1e9))), [r, n];
    },
    platform: "browser",
    release: {},
    config: {},
    uptime: function () {
      return (new Date() - k) / 1e3;
    },
  },
  P =
    "undefined" != typeof globalThis
      ? globalThis
      : "undefined" != typeof window
      ? window
      : "undefined" != typeof global
      ? global
      : "undefined" != typeof self
      ? self
      : {},
  R = {},
  U = {},
  C = {},
  I = {};
Object.defineProperty(I, "__esModule", { value: !0 }),
  (I.version = void 0),
  (I.version = "2.86.2"),
  (function (e) {
    Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.DEFAULT_REALTIME_OPTIONS =
        e.DEFAULT_AUTH_OPTIONS =
        e.DEFAULT_DB_OPTIONS =
        e.DEFAULT_GLOBAL_OPTIONS =
        e.DEFAULT_HEADERS =
          void 0);
    const t = I;
    let r = "";
    (r =
      "undefined" != typeof Deno
        ? "deno"
        : "undefined" != typeof document
        ? "web"
        : "undefined" != typeof navigator && "ReactNative" === navigator.product
        ? "react-native"
        : "node"),
      (e.DEFAULT_HEADERS = {
        "X-Client-Info": `supabase-js-${r}/${t.version}`,
      }),
      (e.DEFAULT_GLOBAL_OPTIONS = { headers: e.DEFAULT_HEADERS }),
      (e.DEFAULT_DB_OPTIONS = { schema: "public" }),
      (e.DEFAULT_AUTH_OPTIONS = {
        autoRefreshToken: !0,
        persistSession: !0,
        detectSessionInUrl: !0,
        flowType: "implicit",
      }),
      (e.DEFAULT_REALTIME_OPTIONS = {});
  })(C);
var x = {};
!(function (e) {
  Object.defineProperty(e, "__esModule", { value: !0 }),
    (e.fetchWithAuth = e.resolveHeadersConstructor = e.resolveFetch = void 0);
  e.resolveFetch = (e) => (e ? (...t) => e(...t) : (...e) => fetch(...e));
  e.resolveHeadersConstructor = () => Headers;
  e.fetchWithAuth = (t, r, n) => {
    const s = (0, e.resolveFetch)(n),
      o = (0, e.resolveHeadersConstructor)();
    return async (e, n) => {
      var i;
      const a = null !== (i = await r()) && void 0 !== i ? i : t;
      let u = new o(null == n ? void 0 : n.headers);
      return (
        u.has("apikey") || u.set("apikey", t),
        u.has("Authorization") || u.set("Authorization", `Bearer ${a}`),
        s(e, Object.assign(Object.assign({}, n), { headers: u }))
      );
    };
  };
})(x);
var N = {};
function D(e) {
  return e.endsWith("/") ? e : e + "/";
}
Object.defineProperty(N, "__esModule", { value: !0 }),
  (N.isBrowser = void 0),
  (N.uuid = function () {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (e) {
        var t = (16 * Math.random()) | 0;
        return ("x" == e ? t : (3 & t) | 8).toString(16);
      }
    );
  }),
  (N.ensureTrailingSlash = D),
  (N.applySettingDefaults = function (e, t) {
    var r, n;
    const { db: s, auth: o, realtime: i, global: a } = e,
      { db: u, auth: c, realtime: l, global: h } = t,
      d = {
        db: Object.assign(Object.assign({}, u), s),
        auth: Object.assign(Object.assign({}, c), o),
        realtime: Object.assign(Object.assign({}, l), i),
        storage: {},
        global: Object.assign(Object.assign(Object.assign({}, h), a), {
          headers: Object.assign(
            Object.assign(
              {},
              null !== (r = null == h ? void 0 : h.headers) && void 0 !== r
                ? r
                : {}
            ),
            null !== (n = null == a ? void 0 : a.headers) && void 0 !== n
              ? n
              : {}
          ),
        }),
        accessToken: async () => "",
      };
    e.accessToken ? (d.accessToken = e.accessToken) : delete d.accessToken;
    return d;
  }),
  (N.validateSupabaseUrl = function (e) {
    const t = null == e ? void 0 : e.trim();
    if (!t) throw new Error("supabaseUrl is required.");
    if (!t.match(/^https?:\/\//i))
      throw new Error(
        "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL."
      );
    try {
      return new URL(D(t));
    } catch (e) {
      throw Error("Invalid supabaseUrl: Provided URL is malformed.");
    }
  });
N.isBrowser = () => "undefined" != typeof window;
var M = {};
Object.defineProperty(M, "__esModule", { value: !0 }),
  (M.SupabaseAuthClient = void 0);
const H = s;
class G extends H.AuthClient {
  constructor(e) {
    super(e);
  }
}
(M.SupabaseAuthClient = G),
  Object.defineProperty(U, "__esModule", { value: !0 });
const B = e,
  K = t,
  z = r,
  $ = n,
  W = C,
  q = x,
  V = N,
  J = M;
(U.default = class {
  constructor(e, t, r) {
    var n, s, o;
    (this.supabaseUrl = e), (this.supabaseKey = t);
    const i = (0, V.validateSupabaseUrl)(e);
    if (!t) throw new Error("supabaseKey is required.");
    (this.realtimeUrl = new URL("realtime/v1", i)),
      (this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace(
        "http",
        "ws"
      )),
      (this.authUrl = new URL("auth/v1", i)),
      (this.storageUrl = new URL("storage/v1", i)),
      (this.functionsUrl = new URL("functions/v1", i));
    const a = `sb-${i.hostname.split(".")[0]}-auth-token`,
      u = {
        db: W.DEFAULT_DB_OPTIONS,
        realtime: W.DEFAULT_REALTIME_OPTIONS,
        auth: Object.assign(Object.assign({}, W.DEFAULT_AUTH_OPTIONS), {
          storageKey: a,
        }),
        global: W.DEFAULT_GLOBAL_OPTIONS,
      },
      c = (0, V.applySettingDefaults)(null != r ? r : {}, u);
    (this.storageKey =
      null !== (n = c.auth.storageKey) && void 0 !== n ? n : ""),
      (this.headers = null !== (s = c.global.headers) && void 0 !== s ? s : {}),
      c.accessToken
        ? ((this.accessToken = c.accessToken),
          (this.auth = new Proxy(
            {},
            {
              get: (e, t) => {
                throw new Error(
                  `@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(
                    t
                  )} is not possible`
                );
              },
            }
          )))
        : (this.auth = this._initSupabaseAuthClient(
            null !== (o = c.auth) && void 0 !== o ? o : {},
            this.headers,
            c.global.fetch
          )),
      (this.fetch = (0, q.fetchWithAuth)(
        t,
        this._getAccessToken.bind(this),
        c.global.fetch
      )),
      (this.realtime = this._initRealtimeClient(
        Object.assign(
          {
            headers: this.headers,
            accessToken: this._getAccessToken.bind(this),
          },
          c.realtime
        )
      )),
      this.accessToken &&
        this.accessToken()
          .then((e) => this.realtime.setAuth(e))
          .catch((e) =>
            console.warn("Failed to set initial Realtime auth token:", e)
          ),
      (this.rest = new K.PostgrestClient(new URL("rest/v1", i).href, {
        headers: this.headers,
        schema: c.db.schema,
        fetch: this.fetch,
      })),
      (this.storage = new $.StorageClient(
        this.storageUrl.href,
        this.headers,
        this.fetch,
        null == r ? void 0 : r.storage
      )),
      c.accessToken || this._listenForAuthEvents();
  }
  get functions() {
    return new B.FunctionsClient(this.functionsUrl.href, {
      headers: this.headers,
      customFetch: this.fetch,
    });
  }
  from(e) {
    return this.rest.from(e);
  }
  schema(e) {
    return this.rest.schema(e);
  }
  rpc(e, t = {}, r = { head: !1, get: !1, count: void 0 }) {
    return this.rest.rpc(e, t, r);
  }
  channel(e, t = { config: {} }) {
    return this.realtime.channel(e, t);
  }
  getChannels() {
    return this.realtime.getChannels();
  }
  removeChannel(e) {
    return this.realtime.removeChannel(e);
  }
  removeAllChannels() {
    return this.realtime.removeAllChannels();
  }
  async _getAccessToken() {
    var e, t;
    if (this.accessToken) return await this.accessToken();
    const { data: r } = await this.auth.getSession();
    return null !==
      (t =
        null === (e = r.session) || void 0 === e ? void 0 : e.access_token) &&
      void 0 !== t
      ? t
      : this.supabaseKey;
  }
  _initSupabaseAuthClient(
    {
      autoRefreshToken: e,
      persistSession: t,
      detectSessionInUrl: r,
      storage: n,
      userStorage: s,
      storageKey: o,
      flowType: i,
      lock: a,
      debug: u,
      throwOnError: c,
    },
    l,
    h
  ) {
    const d = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`,
    };
    return new J.SupabaseAuthClient({
      url: this.authUrl.href,
      headers: Object.assign(Object.assign({}, d), l),
      storageKey: o,
      autoRefreshToken: e,
      persistSession: t,
      detectSessionInUrl: r,
      storage: n,
      userStorage: s,
      flowType: i,
      lock: a,
      debug: u,
      throwOnError: c,
      fetch: h,
      hasCustomAuthorizationHeader: Object.keys(this.headers).some(
        (e) => "authorization" === e.toLowerCase()
      ),
    });
  }
  _initRealtimeClient(e) {
    return new z.RealtimeClient(
      this.realtimeUrl.href,
      Object.assign(Object.assign({}, e), {
        params: Object.assign(
          { apikey: this.supabaseKey },
          null == e ? void 0 : e.params
        ),
      })
    );
  }
  _listenForAuthEvents() {
    return this.auth.onAuthStateChange((e, t) => {
      this._handleTokenChanged(
        e,
        "CLIENT",
        null == t ? void 0 : t.access_token
      );
    });
  }
  _handleTokenChanged(e, t, r) {
    ("TOKEN_REFRESHED" !== e && "SIGNED_IN" !== e) ||
    this.changedAccessToken === r
      ? "SIGNED_OUT" === e &&
        (this.realtime.setAuth(),
        "STORAGE" == t && this.auth.signOut(),
        (this.changedAccessToken = void 0))
      : ((this.changedAccessToken = r), this.realtime.setAuth(r));
  }
}),
  (function (n) {
    var o =
        (P && P.__createBinding) ||
        (Object.create
          ? function (e, t, r, n) {
              void 0 === n && (n = r);
              var s = Object.getOwnPropertyDescriptor(t, r);
              (s &&
                !("get" in s ? !t.__esModule : s.writable || s.configurable)) ||
                (s = {
                  enumerable: !0,
                  get: function () {
                    return t[r];
                  },
                }),
                Object.defineProperty(e, n, s);
            }
          : function (e, t, r, n) {
              void 0 === n && (n = r), (e[n] = t[r]);
            }),
      i =
        (P && P.__exportStar) ||
        function (e, t) {
          for (var r in e)
            "default" === r ||
              Object.prototype.hasOwnProperty.call(t, r) ||
              o(t, e, r);
        },
      a =
        (P && P.__importDefault) ||
        function (e) {
          return e && e.__esModule ? e : { default: e };
        };
    Object.defineProperty(n, "__esModule", { value: !0 }),
      (n.createClient =
        n.SupabaseClient =
        n.FunctionRegion =
        n.FunctionsError =
        n.FunctionsRelayError =
        n.FunctionsFetchError =
        n.FunctionsHttpError =
        n.PostgrestError =
          void 0);
    const u = a(U);
    i(s, n);
    var c = t;
    Object.defineProperty(n, "PostgrestError", {
      enumerable: !0,
      get: function () {
        return c.PostgrestError;
      },
    });
    var l = e;
    Object.defineProperty(n, "FunctionsHttpError", {
      enumerable: !0,
      get: function () {
        return l.FunctionsHttpError;
      },
    }),
      Object.defineProperty(n, "FunctionsFetchError", {
        enumerable: !0,
        get: function () {
          return l.FunctionsFetchError;
        },
      }),
      Object.defineProperty(n, "FunctionsRelayError", {
        enumerable: !0,
        get: function () {
          return l.FunctionsRelayError;
        },
      }),
      Object.defineProperty(n, "FunctionsError", {
        enumerable: !0,
        get: function () {
          return l.FunctionsError;
        },
      }),
      Object.defineProperty(n, "FunctionRegion", {
        enumerable: !0,
        get: function () {
          return l.FunctionRegion;
        },
      }),
      i(r, n);
    var h = U;
    Object.defineProperty(n, "SupabaseClient", {
      enumerable: !0,
      get: function () {
        return a(h).default;
      },
    });
    (n.createClient = (e, t, r) => new u.default(e, t, r)),
      (function () {
        if ("undefined" != typeof window) return !1;
        const e = L.version;
        if (null == e) return !1;
        const t = e.match(/^v(\d+)\./);
        return !!t && parseInt(t[1], 10) <= 18;
      })() &&
        console.warn(
          "⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217"
        );
  })(R);
var X = o({ __proto__: null, default: R }, [R]);
const {
  PostgrestError: Y,
  FunctionsHttpError: Q,
  FunctionsFetchError: Z,
  FunctionsRelayError: ee,
  FunctionsError: te,
  FunctionRegion: re,
  SupabaseClient: ne,
  createClient: se,
  GoTrueAdminApi: oe,
  GoTrueClient: ie,
  AuthAdminApi: ae,
  AuthClient: ue,
  navigatorLock: ce,
  NavigatorLockAcquireTimeoutError: le,
  lockInternals: he,
  processLock: de,
  SIGN_OUT_SCOPES: fe,
  AuthError: pe,
  AuthApiError: be,
  AuthUnknownError: ge,
  CustomAuthError: Ee,
  AuthSessionMissingError: me,
  AuthInvalidTokenResponseError: Te,
  AuthInvalidCredentialsError: ve,
  AuthImplicitGrantRedirectError: Ae,
  AuthPKCEGrantCodeExchangeError: _e,
  AuthRetryableFetchError: we,
  AuthWeakPasswordError: Oe,
  AuthInvalidJwtError: ye,
  isAuthError: Se,
  isAuthApiError: je,
  isAuthSessionMissingError: Fe,
  isAuthImplicitGrantRedirectError: ke,
  isAuthRetryableFetchError: Le,
  isAuthWeakPasswordError: Pe,
  RealtimePresence: Re,
  RealtimeChannel: Ue,
  RealtimeClient: Ce,
  REALTIME_LISTEN_TYPES: Ie,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT: xe,
  REALTIME_PRESENCE_LISTEN_EVENTS: Ne,
  REALTIME_SUBSCRIBE_STATES: De,
  REALTIME_CHANNEL_STATES: Me,
} = R || X;
var He = R || X;
export {
  ae as AuthAdminApi,
  be as AuthApiError,
  ue as AuthClient,
  pe as AuthError,
  Ae as AuthImplicitGrantRedirectError,
  ve as AuthInvalidCredentialsError,
  ye as AuthInvalidJwtError,
  Te as AuthInvalidTokenResponseError,
  _e as AuthPKCEGrantCodeExchangeError,
  we as AuthRetryableFetchError,
  me as AuthSessionMissingError,
  ge as AuthUnknownError,
  Oe as AuthWeakPasswordError,
  Ee as CustomAuthError,
  re as FunctionRegion,
  te as FunctionsError,
  Z as FunctionsFetchError,
  Q as FunctionsHttpError,
  ee as FunctionsRelayError,
  oe as GoTrueAdminApi,
  ie as GoTrueClient,
  le as NavigatorLockAcquireTimeoutError,
  Y as PostgrestError,
  Me as REALTIME_CHANNEL_STATES,
  Ie as REALTIME_LISTEN_TYPES,
  xe as REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  Ne as REALTIME_PRESENCE_LISTEN_EVENTS,
  De as REALTIME_SUBSCRIBE_STATES,
  Ue as RealtimeChannel,
  Ce as RealtimeClient,
  Re as RealtimePresence,
  fe as SIGN_OUT_SCOPES,
  ne as SupabaseClient,
  se as createClient,
  He as default,
  je as isAuthApiError,
  Se as isAuthError,
  ke as isAuthImplicitGrantRedirectError,
  Le as isAuthRetryableFetchError,
  Fe as isAuthSessionMissingError,
  Pe as isAuthWeakPasswordError,
  he as lockInternals,
  ce as navigatorLock,
  de as processLock,
};

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ2ZXJzaW9uIiwidmVyc2lvbl8xIiwicmVxdWlyZSQkMCIsIkpTX0VOViIsIkRlbm8iLCJkb2N1bWVudCIsIm5hdmlnYXRvciIsInByb2R1Y3QiLCJleHBvcnRzIiwiREVGQVVMVF9IRUFERVJTIiwiREVGQVVMVF9HTE9CQUxfT1BUSU9OUyIsImhlYWRlcnMiLCJERUZBVUxUX0RCX09QVElPTlMiLCJzY2hlbWEiLCJERUZBVUxUX0FVVEhfT1BUSU9OUyIsImF1dG9SZWZyZXNoVG9rZW4iLCJwZXJzaXN0U2Vzc2lvbiIsImRldGVjdFNlc3Npb25JblVybCIsImZsb3dUeXBlIiwiREVGQVVMVF9SRUFMVElNRV9PUFRJT05TIiwicmVzb2x2ZUZldGNoIiwiY3VzdG9tRmV0Y2giLCJhcmdzIiwiZmV0Y2giLCJyZXNvbHZlSGVhZGVyc0NvbnN0cnVjdG9yIiwiSGVhZGVycyIsImZldGNoV2l0aEF1dGgiLCJzdXBhYmFzZUtleSIsImdldEFjY2Vzc1Rva2VuIiwiSGVhZGVyc0NvbnN0cnVjdG9yIiwiYXN5bmMiLCJpbnB1dCIsImluaXQiLCJhY2Nlc3NUb2tlbiIsIl9hIiwiaGFzIiwic2V0IiwiT2JqZWN0IiwiYXNzaWduIiwiZW5zdXJlVHJhaWxpbmdTbGFzaCIsInVybCIsImVuZHNXaXRoIiwiaGVscGVycyIsInV1aWQiLCJyZXBsYWNlIiwiYyIsInIiLCJNYXRoIiwicmFuZG9tIiwidG9TdHJpbmciLCJhcHBseVNldHRpbmdEZWZhdWx0cyIsIm9wdGlvbnMiLCJkZWZhdWx0cyIsImRiIiwiZGJPcHRpb25zIiwiYXV0aCIsImF1dGhPcHRpb25zIiwicmVhbHRpbWUiLCJyZWFsdGltZU9wdGlvbnMiLCJnbG9iYWwiLCJnbG9iYWxPcHRpb25zIiwicmVzdWx0Iiwic3RvcmFnZSIsIl9iIiwidmFsaWRhdGVTdXBhYmFzZVVybCIsInN1cGFiYXNlVXJsIiwidHJpbW1lZFVybCIsInRyaW0iLCJFcnJvciIsIm1hdGNoIiwiVVJMIiwiaXNCcm93c2VyIiwid2luZG93IiwiYXV0aF9qc18xIiwiU3VwYWJhc2VBdXRoQ2xpZW50IiwiQXV0aENsaWVudCIsImNvbnN0cnVjdG9yIiwic3VwZXIiLCJTdXBhYmFzZUF1dGhDbGllbnRfMSIsImZ1bmN0aW9uc19qc18xIiwicG9zdGdyZXN0X2pzXzEiLCJyZXF1aXJlJCQxIiwicmVhbHRpbWVfanNfMSIsInJlcXVpcmUkJDIiLCJzdG9yYWdlX2pzXzEiLCJyZXF1aXJlJCQzIiwiY29uc3RhbnRzXzEiLCJyZXF1aXJlJCQ0IiwiZmV0Y2hfMSIsInJlcXVpcmUkJDUiLCJoZWxwZXJzXzEiLCJyZXF1aXJlJCQ2IiwicmVxdWlyZSQkNyIsIlN1cGFiYXNlQ2xpZW50XzEiLCJkZWZhdWx0IiwidGhpcyIsImJhc2VVcmwiLCJyZWFsdGltZVVybCIsInByb3RvY29sIiwiYXV0aFVybCIsInN0b3JhZ2VVcmwiLCJmdW5jdGlvbnNVcmwiLCJkZWZhdWx0U3RvcmFnZUtleSIsImhvc3RuYW1lIiwic3BsaXQiLCJERUZBVUxUUyIsInN0b3JhZ2VLZXkiLCJzZXR0aW5ncyIsIlByb3h5IiwiZ2V0IiwiXyIsInByb3AiLCJTdHJpbmciLCJfaW5pdFN1cGFiYXNlQXV0aENsaWVudCIsIl9jIiwiX2dldEFjY2Vzc1Rva2VuIiwiYmluZCIsIl9pbml0UmVhbHRpbWVDbGllbnQiLCJ0aGVuIiwidG9rZW4iLCJzZXRBdXRoIiwiY2F0Y2giLCJlIiwiY29uc29sZSIsIndhcm4iLCJyZXN0IiwiUG9zdGdyZXN0Q2xpZW50IiwiaHJlZiIsIlN0b3JhZ2VDbGllbnQiLCJfbGlzdGVuRm9yQXV0aEV2ZW50cyIsImZ1bmN0aW9ucyIsIkZ1bmN0aW9uc0NsaWVudCIsImZyb20iLCJyZWxhdGlvbiIsInJwYyIsImZuIiwiaGVhZCIsImNvdW50IiwidW5kZWZpbmVkIiwiY2hhbm5lbCIsIm5hbWUiLCJvcHRzIiwiY29uZmlnIiwiZ2V0Q2hhbm5lbHMiLCJyZW1vdmVDaGFubmVsIiwicmVtb3ZlQWxsQ2hhbm5lbHMiLCJkYXRhIiwiZ2V0U2Vzc2lvbiIsInNlc3Npb24iLCJhY2Nlc3NfdG9rZW4iLCJ1c2VyU3RvcmFnZSIsImxvY2siLCJkZWJ1ZyIsInRocm93T25FcnJvciIsImF1dGhIZWFkZXJzIiwiQXV0aG9yaXphdGlvbiIsImFwaWtleSIsImhhc0N1c3RvbUF1dGhvcml6YXRpb25IZWFkZXIiLCJrZXlzIiwic29tZSIsImtleSIsInRvTG93ZXJDYXNlIiwiUmVhbHRpbWVDbGllbnQiLCJwYXJhbXMiLCJvbkF1dGhTdGF0ZUNoYW5nZSIsImV2ZW50IiwiX2hhbmRsZVRva2VuQ2hhbmdlZCIsInNvdXJjZSIsImNoYW5nZWRBY2Nlc3NUb2tlbiIsInNpZ25PdXQiLCJfX2ltcG9ydERlZmF1bHQiLCJfX2V4cG9ydFN0YXIiLCJkZWZpbmVQcm9wZXJ0eSIsImVudW1lcmFibGUiLCJQb3N0Z3Jlc3RFcnJvciIsIkZ1bmN0aW9uc0h0dHBFcnJvciIsIkZ1bmN0aW9uc0ZldGNoRXJyb3IiLCJGdW5jdGlvbnNSZWxheUVycm9yIiwiRnVuY3Rpb25zRXJyb3IiLCJGdW5jdGlvblJlZ2lvbiIsIlN1cGFiYXNlQ2xpZW50XzIiLCJjcmVhdGVDbGllbnQiLCJwcm9jZXNzVmVyc2lvbiIsInByb2Nlc3MiLCJ2ZXJzaW9uTWF0Y2giLCJwYXJzZUludCIsInNob3VsZFNob3dEZXByZWNhdGlvbldhcm5pbmciLCJTdXBhYmFzZUNsaWVudCIsIkdvVHJ1ZUFkbWluQXBpIiwiR29UcnVlQ2xpZW50IiwiQXV0aEFkbWluQXBpIiwibmF2aWdhdG9yTG9jayIsIk5hdmlnYXRvckxvY2tBY3F1aXJlVGltZW91dEVycm9yIiwibG9ja0ludGVybmFscyIsInByb2Nlc3NMb2NrIiwiU0lHTl9PVVRfU0NPUEVTIiwiQXV0aEVycm9yIiwiQXV0aEFwaUVycm9yIiwiQXV0aFVua25vd25FcnJvciIsIkN1c3RvbUF1dGhFcnJvciIsIkF1dGhTZXNzaW9uTWlzc2luZ0Vycm9yIiwiQXV0aEludmFsaWRUb2tlblJlc3BvbnNlRXJyb3IiLCJBdXRoSW52YWxpZENyZWRlbnRpYWxzRXJyb3IiLCJBdXRoSW1wbGljaXRHcmFudFJlZGlyZWN0RXJyb3IiLCJBdXRoUEtDRUdyYW50Q29kZUV4Y2hhbmdlRXJyb3IiLCJBdXRoUmV0cnlhYmxlRmV0Y2hFcnJvciIsIkF1dGhXZWFrUGFzc3dvcmRFcnJvciIsIkF1dGhJbnZhbGlkSnd0RXJyb3IiLCJpc0F1dGhFcnJvciIsImlzQXV0aEFwaUVycm9yIiwiaXNBdXRoU2Vzc2lvbk1pc3NpbmdFcnJvciIsImlzQXV0aEltcGxpY2l0R3JhbnRSZWRpcmVjdEVycm9yIiwiaXNBdXRoUmV0cnlhYmxlRmV0Y2hFcnJvciIsImlzQXV0aFdlYWtQYXNzd29yZEVycm9yIiwiUmVhbHRpbWVQcmVzZW5jZSIsIlJlYWx0aW1lQ2hhbm5lbCIsIlJFQUxUSU1FX0xJU1RFTl9UWVBFUyIsIlJFQUxUSU1FX1BPU1RHUkVTX0NIQU5HRVNfTElTVEVOX0VWRU5UIiwiUkVBTFRJTUVfUFJFU0VOQ0VfTElTVEVOX0VWRU5UUyIsIlJFQUxUSU1FX1NVQlNDUklCRV9TVEFURVMiLCJSRUFMVElNRV9DSEFOTkVMX1NUQVRFUyIsImluZGV4LmRlZmF1bHQiLCJpbmRleCIsIndyYXBwZXIiXSwic291cmNlcyI6WyIvbnBtL0BzdXBhYmFzZS9zdXBhYmFzZS1qc0AyLjg2LjIvc3JjL2xpYi92ZXJzaW9uLnRzIiwiL25wbS9Ac3VwYWJhc2Uvc3VwYWJhc2UtanNAMi44Ni4yL3NyYy9saWIvY29uc3RhbnRzLnRzIiwiL25wbS9Ac3VwYWJhc2Uvc3VwYWJhc2UtanNAMi44Ni4yL3NyYy9saWIvZmV0Y2gudHMiLCIvbnBtL0BzdXBhYmFzZS9zdXBhYmFzZS1qc0AyLjg2LjIvc3JjL2xpYi9oZWxwZXJzLnRzIiwiL25wbS9Ac3VwYWJhc2Uvc3VwYWJhc2UtanNAMi44Ni4yL3NyYy9saWIvU3VwYWJhc2VBdXRoQ2xpZW50LnRzIiwiL25wbS9Ac3VwYWJhc2Uvc3VwYWJhc2UtanNAMi44Ni4yL3NyYy9TdXBhYmFzZUNsaWVudC50cyIsIi9ucG0vQHN1cGFiYXNlL3N1cGFiYXNlLWpzQDIuODYuMi9zcmMvaW5kZXgudHMiLCIvbnBtL0BzdXBhYmFzZS9zdXBhYmFzZS1qc0AyLjg2LjIvZGlzdC9lc20vd3JhcHBlci5tanMiXSwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLCJpbXBvcnQgKiBhcyBpbmRleCBmcm9tICcuLi9tYWluL2luZGV4LmpzJ1xuY29uc3Qge1xuICBQb3N0Z3Jlc3RFcnJvcixcbiAgRnVuY3Rpb25zSHR0cEVycm9yLFxuICBGdW5jdGlvbnNGZXRjaEVycm9yLFxuICBGdW5jdGlvbnNSZWxheUVycm9yLFxuICBGdW5jdGlvbnNFcnJvcixcbiAgRnVuY3Rpb25SZWdpb24sXG4gIFN1cGFiYXNlQ2xpZW50LFxuICBjcmVhdGVDbGllbnQsXG4gIEdvVHJ1ZUFkbWluQXBpLFxuICBHb1RydWVDbGllbnQsXG4gIEF1dGhBZG1pbkFwaSxcbiAgQXV0aENsaWVudCxcbiAgbmF2aWdhdG9yTG9jayxcbiAgTmF2aWdhdG9yTG9ja0FjcXVpcmVUaW1lb3V0RXJyb3IsXG4gIGxvY2tJbnRlcm5hbHMsXG4gIHByb2Nlc3NMb2NrLFxuICBTSUdOX09VVF9TQ09QRVMsXG4gIEF1dGhFcnJvcixcbiAgQXV0aEFwaUVycm9yLFxuICBBdXRoVW5rbm93bkVycm9yLFxuICBDdXN0b21BdXRoRXJyb3IsXG4gIEF1dGhTZXNzaW9uTWlzc2luZ0Vycm9yLFxuICBBdXRoSW52YWxpZFRva2VuUmVzcG9uc2VFcnJvcixcbiAgQXV0aEludmFsaWRDcmVkZW50aWFsc0Vycm9yLFxuICBBdXRoSW1wbGljaXRHcmFudFJlZGlyZWN0RXJyb3IsXG4gIEF1dGhQS0NFR3JhbnRDb2RlRXhjaGFuZ2VFcnJvcixcbiAgQXV0aFJldHJ5YWJsZUZldGNoRXJyb3IsXG4gIEF1dGhXZWFrUGFzc3dvcmRFcnJvcixcbiAgQXV0aEludmFsaWRKd3RFcnJvcixcbiAgaXNBdXRoRXJyb3IsXG4gIGlzQXV0aEFwaUVycm9yLFxuICBpc0F1dGhTZXNzaW9uTWlzc2luZ0Vycm9yLFxuICBpc0F1dGhJbXBsaWNpdEdyYW50UmVkaXJlY3RFcnJvcixcbiAgaXNBdXRoUmV0cnlhYmxlRmV0Y2hFcnJvcixcbiAgaXNBdXRoV2Vha1Bhc3N3b3JkRXJyb3IsXG4gIFJlYWx0aW1lUHJlc2VuY2UsXG4gIFJlYWx0aW1lQ2hhbm5lbCxcbiAgUmVhbHRpbWVDbGllbnQsXG4gIFJFQUxUSU1FX0xJU1RFTl9UWVBFUyxcbiAgUkVBTFRJTUVfUE9TVEdSRVNfQ0hBTkdFU19MSVNURU5fRVZFTlQsXG4gIFJFQUxUSU1FX1BSRVNFTkNFX0xJU1RFTl9FVkVOVFMsXG4gIFJFQUxUSU1FX1NVQlNDUklCRV9TVEFURVMsXG4gIFJFQUxUSU1FX0NIQU5ORUxfU1RBVEVTLFxufSA9IGluZGV4LmRlZmF1bHQgfHwgaW5kZXhcblxuZXhwb3J0IHtcbiAgUG9zdGdyZXN0RXJyb3IsXG4gIEZ1bmN0aW9uc0h0dHBFcnJvcixcbiAgRnVuY3Rpb25zRmV0Y2hFcnJvcixcbiAgRnVuY3Rpb25zUmVsYXlFcnJvcixcbiAgRnVuY3Rpb25zRXJyb3IsXG4gIEZ1bmN0aW9uUmVnaW9uLFxuICBTdXBhYmFzZUNsaWVudCxcbiAgY3JlYXRlQ2xpZW50LFxuICBHb1RydWVBZG1pbkFwaSxcbiAgR29UcnVlQ2xpZW50LFxuICBBdXRoQWRtaW5BcGksXG4gIEF1dGhDbGllbnQsXG4gIG5hdmlnYXRvckxvY2ssXG4gIE5hdmlnYXRvckxvY2tBY3F1aXJlVGltZW91dEVycm9yLFxuICBsb2NrSW50ZXJuYWxzLFxuICBwcm9jZXNzTG9jayxcbiAgU0lHTl9PVVRfU0NPUEVTLFxuICBBdXRoRXJyb3IsXG4gIEF1dGhBcGlFcnJvcixcbiAgQXV0aFVua25vd25FcnJvcixcbiAgQ3VzdG9tQXV0aEVycm9yLFxuICBBdXRoU2Vzc2lvbk1pc3NpbmdFcnJvcixcbiAgQXV0aEludmFsaWRUb2tlblJlc3BvbnNlRXJyb3IsXG4gIEF1dGhJbnZhbGlkQ3JlZGVudGlhbHNFcnJvcixcbiAgQXV0aEltcGxpY2l0R3JhbnRSZWRpcmVjdEVycm9yLFxuICBBdXRoUEtDRUdyYW50Q29kZUV4Y2hhbmdlRXJyb3IsXG4gIEF1dGhSZXRyeWFibGVGZXRjaEVycm9yLFxuICBBdXRoV2Vha1Bhc3N3b3JkRXJyb3IsXG4gIEF1dGhJbnZhbGlkSnd0RXJyb3IsXG4gIGlzQXV0aEVycm9yLFxuICBpc0F1dGhBcGlFcnJvcixcbiAgaXNBdXRoU2Vzc2lvbk1pc3NpbmdFcnJvcixcbiAgaXNBdXRoSW1wbGljaXRHcmFudFJlZGlyZWN0RXJyb3IsXG4gIGlzQXV0aFJldHJ5YWJsZUZldGNoRXJyb3IsXG4gIGlzQXV0aFdlYWtQYXNzd29yZEVycm9yLFxuICBSZWFsdGltZVByZXNlbmNlLFxuICBSZWFsdGltZUNoYW5uZWwsXG4gIFJlYWx0aW1lQ2xpZW50LFxuICBSRUFMVElNRV9MSVNURU5fVFlQRVMsXG4gIFJFQUxUSU1FX1BPU1RHUkVTX0NIQU5HRVNfTElTVEVOX0VWRU5ULFxuICBSRUFMVElNRV9QUkVTRU5DRV9MSVNURU5fRVZFTlRTLFxuICBSRUFMVElNRV9TVUJTQ1JJQkVfU1RBVEVTLFxuICBSRUFMVElNRV9DSEFOTkVMX1NUQVRFUyxcbn1cblxuZXhwb3J0IGRlZmF1bHQgaW5kZXguZGVmYXVsdCB8fCBpbmRleFxuIl0sIm1hcHBpbmdzIjoiOHRGQU1vQkEsVUFBRyxTLHNMQ0h2QixNQUFtQ0MsRUFBQUMsRUFFbkMsSUFBSUMsRUFBUyxHQUdYQSxFQURrQixvQkFBVEMsS0FDQSxPQUNvQixvQkFBYkMsU0FDUCxNQUNxQixvQkFBZEMsV0FBbUQsZ0JBQXRCQSxVQUFVQyxRQUM5QyxlQUVBLE9BR0VDLEVBQUFDLGdCQUFrQixDQUFFLGdCQUFpQixlQUFlTixLQUFVRixFQUFBRCxXQUU5RFEsRUFBeUJFLHVCQUFBLENBQ3BDQyxRQUFTSCxFQUFlQyxpQkFHYkQsRUFBcUJJLG1CQUFBLENBQ2hDQyxPQUFRLFVBR0dMLEVBQWtETSxxQkFBQSxDQUM3REMsa0JBQWtCLEVBQ2xCQyxnQkFBZ0IsRUFDaEJDLG9CQUFvQixFQUNwQkMsU0FBVSxZQUdDVixFQUFBVyx5QkFBa0QsRSw4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
