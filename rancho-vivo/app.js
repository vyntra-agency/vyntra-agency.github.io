/* Rancho Vivo: registro de ganado y dinero del rancho.
   Funciona sin señal: todo se guarda primero en el teléfono y se sube
   en orden cuando hay conexión (cola en localStorage). */
(function () {
  'use strict';

  var sb = supabase.createClient(RV_CONFIG.url, RV_CONFIG.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  var app = document.getElementById('app');
  var hoja = document.getElementById('hoja');
  var VERSION = '2.8.1';
  var TABLAS = ['campo_potreros', 'campo_animales', 'campo_eventos', 'campo_finanzas'];

  var CATEGORIAS = {
    hembra: [['vaca', 'Vaca'], ['vaquilla', 'Vaquilla'], ['becerra', 'Becerra']],
    macho: [['toro', 'Toro'], ['novillo', 'Novillo'], ['becerro', 'Becerro']]
  };
  var NOMBRE_CAT = { vaca: 'Vaca', vaquilla: 'Vaquilla', becerra: 'Becerra', toro: 'Toro', novillo: 'Novillo', becerro: 'Becerro' };
  var CAT_GASTO = ['Alimento y suplemento', 'Medicinas y vacunas', 'Veterinario', 'Mano de obra', 'Combustible', 'Mantenimiento', 'Compra de ganado', 'Agua y luz', 'Fletes', 'Otro'];
  var CAT_INGRESO = ['Venta de ganado', 'Apoyos y subsidios', 'Renta de pasto', 'Otro'];
  var EVENTOS = {
    alta: ['Alta en el registro', 'nota'], pesaje: ['Pesaje', 'bascula'], vacuna: ['Vacuna', 'jeringa'], tratamiento: ['Tratamiento', 'jeringa'],
    parto: ['Parto', 'cria'], prenez: ['Diagnóstico de preñez', 'prenez'], movimiento: ['Cambio de potrero', 'mover'],
    venta: ['Venta', 'vender'], muerte: ['Baja por muerte', 'baja'], nota: ['Nota', 'nota'],
    destete: ['Destete', 'bascula'], compra: ['Compra', 'vender']
  };
  var AGUA = { con_agua: ['Con agua', 'bien'], baja: ['Agua baja', 'aviso'], sin_agua: ['Sin agua', 'mal'] };

  var ICON = {
    inicio: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    ganado: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    dinero: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z"/><circle cx="16" cy="14.5" r="1.2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    atras: '<path d="m15 6-6 6 6 6"/>',
    cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
    bascula: '<path d="M4 20h16M6 20 8 8h8l2 12M12 8V5M10.5 13.5 13 11"/>',
    jeringa: '<path d="m18 2 4 4M15 5l4 4M12.5 7.5l4 4L9 19H5v-4zM4 20l1-1M9 11l2 2"/>',
    cria: '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>',
    prenez: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.5 2.5L16 9"/>',
    mover: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    vender: '<path d="M12 3v18M16.5 7.5c0-1.9-2-3-4.5-3S7.5 5.6 7.5 7.5s2 3 4.5 3.5 4.5 1.6 4.5 3.5-2 3-4.5 3-4.5-1.1-4.5-3"/>',
    baja: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
    nota: '<path d="M5 4h10l4 4v12H5zM9 12h6M9 16h4"/>',
    editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    borrar: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    potrero: '<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>',
    agua: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    descargar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    reporte: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 17v-3M12 17v-6M15 17v-4"/>',
    historial: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    salir: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
    sync: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>',
    alerta: '<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>',
    gasto: '<path d="M7 17 17 7M9 7h8v8"/>',
    ingreso: '<path d="M17 7 7 17M15 17H7V9"/>',
    usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    foto: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    escribir: '<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>',
    clip: '<path d="m20 11.5-8.4 8.4a5 5 0 0 1-7.1-7.1l8.8-8.8a3.4 3.4 0 0 1 4.8 4.8l-8.8 8.8a1.7 1.7 0 0 1-2.4-2.4l8-8"/>',
    enviar: '<path d="M5 12h13M12 5l7 7-7 7"/>'
  };
  var PELAJE = { negro: ['#2E2A27', '#F3EBDD'], colorado: ['#8E3F22', '#F8E8DA'], 'cara blanca': ['#9A4E2C', '#FBEBDD'], blanco: ['#E9E2D3', '#5A4C3E'], bayo: ['#C8A46B', '#3B2C1C'], pinto: ['#7A7068', '#F4EEE6'], gris: ['#8B8D8F', '#F4F4F2'] };
  function estiloPelaje(c) { var p = PELAJE[(c || '').toLowerCase().trim()]; return p ? ' style="background:' + p[0] + ';color:' + p[1] + '"' : ''; }
  function avatarAnimal(a, clase) { var t = a.arete.length > 5 ? a.arete.slice(-4) : a.arete; return '<span class="avatar' + (clase ? ' ' + clase : '') + '"' + estiloPelaje(a.color) + '>' + e(t) + '</span>'; }
  /* Iniciales del rancho para su fierro: "Rancho La Esperanza" → "LE" */
  function iniciales(nombre) {
    var w = String(nombre || '').replace(/\(.*?\)/g, '').split(/\s+/).filter(function (x) { return x && !/^rancho$/i.test(x); });
    return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || 'R').slice(0, 2)).toUpperCase();
  }
  function ico(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>'; }

  /* ---------- Utilidades ---------- */
  function e(s) { return s == null ? '' : String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }
  function hoy() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function fecha(s, corta) {
    if (!s) return '';
    var d = new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
    return d.toLocaleDateString('es-MX', corta ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function pesos(n) { n = Math.round(n || 0); return (n < 0 ? '−$' : '$') + Math.abs(n).toLocaleString('es-MX'); }
  function kg(n) { return n == null || n === '' ? '' : (+n).toLocaleString('es-MX', { maximumFractionDigits: 1 }) + ' kg'; }
  function edad(nac) {
    if (!nac) return '';
    var a = new Date(+nac.slice(0, 4), +nac.slice(5, 7) - 1, +nac.slice(8, 10)), b = new Date();
    var m = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth() - (b.getDate() < a.getDate() ? 1 : 0);
    if (m < 0) return '';
    if (m < 12) return m + (m === 1 ? ' mes' : ' meses');
    var y = Math.floor(m / 12), r = m % 12;
    return y + (y === 1 ? ' año' : ' años') + (r ? ' ' + r + ' m' : '');
  }
  function num(v) { var n = parseFloat(String(v).replace(/,/g, '')); return isFinite(n) ? n : null; }
  function aviso(t, mal) {
    var a = document.getElementById('aviso');
    a.textContent = t; a.className = 'ver' + (mal ? ' mal' : '');
    clearTimeout(aviso.t); aviso.t = setTimeout(function () { a.className = ''; }, 2600);
  }
  function guardarLocal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (x) {} }
  function leerLocal(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (x) { return null; } }

  /* ---------- Estado y sincronización ---------- */
  var S = { usuario: null, rancho: null, rol: null, miembro: null, ranchos: [], datos: null, cola: [], rechazados: [], sincronizando: false, ultimaCarga: 0 };
  // Pide al teléfono que no borre los datos guardados para trabajar sin señal.
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (x) { }
  function claveDatos() { return 'rv:datos:' + S.rancho.id; }
  function vacio() { var d = {}; TABLAS.forEach(function (t) { d[t] = []; }); return d; }
  function persistir() { guardarLocal(claveDatos(), S.datos); guardarLocal('rv:cola', S.cola); guardarLocal('rv:rechazados', S.rechazados); }
  function tabla(t) { return S.datos[t]; }
  function buscarId(t, id) { var l = S.datos[t]; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }

  function guardar(t, fila) {
    fila.rancho_id = S.rancho.id;
    if (!fila.id) fila.id = uuid();
    var l = S.datos[t], i = l.findIndex(function (x) { return x.id === fila.id; });
    if (i > -1) l[i] = Object.assign({}, l[i], fila); else l.push(fila);
    S.cola.push({ t: t, op: 'guardar', fila: Object.assign({}, i > -1 ? l[i] : fila) });
    persistir();
    return fila;
  }
  function borrar(t, id) {
    var antes = buscarId(t, id);
    S.datos[t] = S.datos[t].filter(function (x) { return x.id !== id; });
    if (t === 'campo_animales') S.datos.campo_eventos = S.datos.campo_eventos.filter(function (x) { return x.animal_id !== id; });
    S.cola.push({ t: t, op: 'borrar', id: id, fila: antes ? Object.assign({}, antes) : null });
    persistir();
  }
  function limpiarFila(t, f) {
    var c = Object.assign({}, f);
    delete c.creado_en; delete c.actualizado_en; delete c.creado_por;
    return c;
  }
  function esErrorDeRed(err) { return !err || !err.code || /fetch|network|Failed/i.test(err.message || ''); }
  function esErrorDeSesion(err) { return /^PGRST30/.test(err.code || '') || /jwt|token|expired/i.test(err.message || ''); }
  function describirCambio(op) {
    var f = op.fila || {}, que;
    if (op.t === 'campo_eventos') { var a = buscarId('campo_animales', f.animal_id); que = (EVENTOS[f.tipo] ? EVENTOS[f.tipo][0] : f.tipo) + (a ? ' · arete ' + a.arete : '') + (f.peso ? ' · ' + kg(f.peso) : ''); }
    else if (op.t === 'campo_animales') que = 'Animal' + (f.arete ? ' arete ' + f.arete : '');
    else if (op.t === 'campo_finanzas') que = (f.tipo === 'ingreso' ? 'Ingreso' : 'Gasto') + (f.monto ? ' ' + pesos(f.monto) : '') + (f.concepto ? ' · ' + f.concepto : '');
    else if (op.t === 'campo_potreros') que = 'Potrero' + (f.nombre ? ' ' + f.nombre : '');
    else que = 'Cambio';
    return (op.op === 'borrar' ? 'Borrar: ' : '') + que + (f.fecha ? ' · ' + fecha(f.fecha, true) : '');
  }
  function formRechazados() {
    abrirHoja('Cambios por revisar',
      '<p class="ayuda-sel">Estos cambios no se pudieron guardar en el servidor. No se borraron: puede volver a intentarlo o descartarlos.</p>' +
      '<ul class="rechazados">' + S.rechazados.map(function (op, k) {
        return '<li><b>' + e(describirCambio(op)) + '</b><small>' + e(op.error || '') + '</small><button type="button" data-descartar="' + k + '">Descartar</button></li>';
      }).join('') + '</ul>',
      '<button type="submit" class="btn ancho">Volver a intentar ' + (S.rechazados.length === 1 ? 'el cambio' : 'los ' + S.rechazados.length) + '</button>',
      function (f) {
        hoja.querySelectorAll('[data-descartar]').forEach(function (b) {
          b.onclick = function () {
            if (b.dataset.seguro !== '1') { b.dataset.seguro = '1'; b.textContent = '¿Seguro?'; return; }
            S.rechazados.splice(+b.dataset.descartar, 1); persistir(); hoja.close();
            if (S.rechazados.length) formRechazados(); else { aviso('Listo, ya no hay cambios por revisar.'); ruta(); }
          };
        });
        f.onsubmit = async function (ev) {
          ev.preventDefault();
          S.rechazados.forEach(function (op) { delete op.error; delete op.cuando; S.cola.push(op); });
          S.rechazados = []; persistir(); hoja.close();
          if (!navigator.onLine) { aviso('Sin señal. Se subirán cuando vuelva.'); ruta(); return; }
          await subir(); ruta();
          if (!S.rechazados.length && !S.cola.length) aviso('Cambios guardados.');
        };
      });
  }

  async function subir() {
    if (S.sincronizando || !S.cola.length || !navigator.onLine) { pintarRed(); return; }
    S.sincronizando = true; pintarRed();
    try {
      while (S.cola.length) {
        var op = S.cola[0], r;
        if (op.op === 'guardar') r = await sb.from(op.t).upsert(limpiarFila(op.t, op.fila));
        else r = await sb.from(op.t).delete().eq('id', op.id);
        if (r.error) {
          if (esErrorDeRed(r.error)) break;
          // Sesión vencida (muchos días sin señal): se renueva sola y se reintenta; nunca se tira el cambio.
          if (esErrorDeSesion(r.error)) {
            var ref = await sb.auth.refreshSession();
            if (!ref.error && !op.reintentoSesion) { op.reintentoSesion = true; continue; }
            aviso('No se pudo confirmar su sesión. Sus cambios siguen guardados en el teléfono y se subirán después.', true);
            break;
          }
          // Rechazado por la base: no se pierde, queda apartado para revisarlo en Más.
          S.cola.shift();
          delete op.reintentoSesion;
          op.error = r.error.code === '23505' ? 'Ese número de arete ya existe en el rancho.'
            : r.error.code === '42501' ? 'Su usuario no tiene permiso para este cambio.'
            : 'El servidor no lo aceptó. Si vuelve a pasar, avise a soporte: WhatsApp 614 272 6674.';
          op.tecnico = (r.error.code || '') + ' ' + (r.error.message || '');
          op.cuando = new Date().toISOString();
          S.rechazados.push(op); persistir();
          aviso((r.error.code === '23505' ? 'Ese número de arete ya existe. ' : 'Un cambio no se pudo guardar. ') + 'Quedó apartado en Más → Cambios por revisar.', true);
          await cargar(true);
          continue;
        }
        S.cola.shift(); persistir();
      }
    } catch (x) { /* sin red: se reintenta después */ }
    S.sincronizando = false; pintarRed();
  }

  async function traerTodo(t) {
    var filas = [], desde = 0, PAG = 1000;
    for (;;) {
      var r = await sb.from(t).select('*').eq('rancho_id', S.rancho.id).range(desde, desde + PAG - 1);
      if (r.error) throw r.error;
      filas = filas.concat(r.data);
      if (r.data.length < PAG) return filas;
      desde += PAG;
    }
  }
  async function cargar(forzar) {
    if (!navigator.onLine) return false;
    if (S.cola.length) { await subir(); if (S.cola.length) return false; }
    if (!forzar && Date.now() - S.ultimaCarga < 30000) return false;
    try {
      var d = vacio(), lotes = await Promise.all(TABLAS.map(function (t) {
        return t === 'campo_finanzas' && !puedeDinero() ? Promise.resolve([]) : traerTodo(t);
      }));
      TABLAS.forEach(function (t, i) { d[t] = lotes[i]; });
      S.datos = d; S.ultimaCarga = Date.now(); persistir();
      return true;
    } catch (x) { return false; }
  }
  function puedeDinero() { return S.rol === 'dueno' || S.rol === 'encargado'; }
  function puedeBorrar() { return S.rol === 'dueno' || S.rol === 'encargado'; }

  function pintarRed() {
    var el = document.getElementById('red');
    if (!el) return;
    var off = !navigator.onLine, pend = S.cola.length, rev = S.rechazados.length;
    el.className = 'estado-red' + (off || pend || rev ? ' off' : '');
    var texto = off ? 'Sin señal' + (pend ? ' · ' + pend + ' por subir' : '') : pend ? 'Subiendo ' + pend : rev ? rev + ' por revisar en Más' : 'Al día';
    el.innerHTML = '<i></i><span>' + texto + '</span>';
    el.title = texto; el.setAttribute('aria-label', texto);
  }
  window.addEventListener('online', function () { subir().then(function () { return cargar(true); }).then(function (c) { if (c) ruta(); }); pintarRed(); });
  window.addEventListener('offline', pintarRed);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && S.rancho) cargar(false).then(function (c) { if (c && !hoja.open) ruta(); });
  });

  /* ---------- Sesión ---------- */
  async function iniciar() {
    var s = await sb.auth.getSession();
    var ses = s.data && s.data.session;
    if (!ses) { var g = leerLocal('rv:sesion'); if (!navigator.onLine && g) return abrirRancho(g, true); return pantallaLogin(); }
    S.usuario = ses.user;
    var guardado = leerLocal('rv:sesion');
    if (!navigator.onLine && guardado && guardado.usuario === ses.user.id) return abrirRancho(guardado, true);
    var r = await sb.from('campo_miembros').select('rol, nombre, rancho_id, campo_ranchos(id, nombre, ubicacion, activo)').eq('user_id', ses.user.id);
    if (r.error) {
      if (guardado) return abrirRancho(guardado, true);
      return pantallaLogin('No se pudo conectar. Revise su señal e intente de nuevo.');
    }
    S.ranchos = r.data.filter(function (m) { return m.campo_ranchos && m.campo_ranchos.activo; });
    if (!S.ranchos.length) { await sb.auth.signOut(); return pantallaLogin('Su usuario no tiene un rancho activo. Escríbanos para revisarlo.'); }
    var elegido = S.ranchos.filter(function (m) { return guardado && m.rancho_id === guardado.rancho.id; })[0] || S.ranchos[0];
    abrirRancho({ usuario: ses.user.id, rancho: elegido.campo_ranchos, rol: elegido.rol, nombre: elegido.nombre }, false);
  }
  async function abrirRancho(g, sinRed) {
    S.rancho = g.rancho; S.rol = g.rol; S.miembro = g.nombre;
    guardarLocal('rv:sesion', g);
    S.datos = leerLocal(claveDatos()) || null;
    S.cola = leerLocal('rv:cola') || [];
    S.rechazados = leerLocal('rv:rechazados') || [];
    if (!S.datos) {
      app.innerHTML = '<div class="marco"><div class="contenido" style="padding-top:40px"><div class="esqueleto"></div><div class="esqueleto"></div><div class="esqueleto"></div></div></div>';
      S.datos = vacio();
      if (!sinRed) await cargar(true);
    } else if (!sinRed) { ruta(); await cargar(true); }
    ruta();
    subir();
    setTimeout(function () { ofrecerInstalar(false); }, 1200);
  }

  /* ---------- Instalar la app en el celular (la primera vez que entra) ---------- */
  var promptInstalar = null;
  window.addEventListener('beforeinstallprompt', function (ev) { ev.preventDefault(); promptInstalar = ev; });
  window.addEventListener('appinstalled', function () { promptInstalar = null; guardarLocal('rv:instalar', 'instalada'); if (hoja.open) hoja.close(); aviso('Listo, Rancho Vivo quedó en su pantalla de inicio.'); });
  function instalada() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  function esIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function enAppAjena() { return /FBAN|FBAV|Instagram|Line\/|WhatsApp|GSA\//i.test(navigator.userAgent); }
  function ofrecerInstalar(forzar) {
    if (instalada() || (!forzar && leerLocal('rv:instalar'))) return;
    if (!forzar && hoja.open) return;
    guardarLocal('rv:instalar', 'visto');
    var paso = function (n, html) { return '<li><span class="paso-n">' + n + '</span><span>' + html + '</span></li>'; };
    var compartir = '<svg class="ico-ios" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Compartir"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/></svg>';
    var menu = '<svg class="ico-ios" viewBox="0 0 24 24" fill="currentColor" aria-label="Menú"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
    var pasos = '';
    if (enAppAjena()) pasos = '<ol class="pasos">' + paso(1, 'Esta liga se abrió dentro de otra app. Toque ' + (esIOS() ? compartir + ' o los tres puntos' : menu) + ' y elija <b>Abrir en ' + (esIOS() ? 'Safari' : 'Chrome') + '</b>.') + paso(2, 'Ahí le volverá a salir este aviso para instalarla.') + '</ol>';
    else if (!promptInstalar && esIOS()) pasos = '<ol class="pasos">' + paso(1, 'Toque el botón <b>Compartir</b> ' + compartir + ' (abajo en Safari, o arriba en iPad).') + paso(2, 'Baje y elija <b>Agregar a inicio</b>.') + paso(3, 'Toque <b>Agregar</b>. Listo: ábrala desde el ícono.') + '</ol>';
    else if (!promptInstalar) pasos = '<ol class="pasos">' + paso(1, 'Toque el menú ' + menu + ' del navegador (arriba a la derecha).') + paso(2, 'Elija <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.') + paso(3, 'Confirme. Listo: ábrala desde el ícono.') + '</ol>';
    abrirHoja('Instale Rancho Vivo',
      '<div class="instalar-cab"><img src="icons/icon-192.png" alt="" width="64" height="64"><div><b>Rancho Vivo</b><span>Directo en su pantalla de inicio</span></div></div>' +
      '<ul class="instalar-pros"><li>Abre con un toque, como cualquier app</li><li>Funciona en el monte, sin señal</li><li>Pantalla completa, sin barra del navegador</li></ul>' + pasos,
      (promptInstalar ? '<button type="submit" class="btn ancho">Instalar ahora</button>' : '<button type="submit" class="btn ancho">Entendido</button>') +
      '<button type="button" class="btn sec ancho" id="ins-luego">Ahora no</button>',
      function (f) {
        hoja.querySelector('#ins-luego').onclick = function () { hoja.close(); aviso('Puede instalarla después en Más → Instalar en el celular.'); };
        f.onsubmit = async function (ev) {
          ev.preventDefault();
          if (!promptInstalar) { hoja.close(); return; }
          var p = promptInstalar; promptInstalar = null;
          p.prompt();
          var r = await p.userChoice.catch(function () { return {}; });
          hoja.close();
          if (r.outcome !== 'accepted') aviso('Puede instalarla después en Más → Instalar en el celular.');
        };
      });
  }
  function pantallaLogin(error) {
    app.innerHTML =
      '<div class="login"><form class="login-centro" id="f-login" novalidate>' +
      '<div class="marca-logo"></div><h1>Rancho Vivo</h1><p class="sub">Su ganado y su dinero, en orden.</p>' +
      '<label for="l-correo">Correo</label><input id="l-correo" type="email" autocomplete="username" inputmode="email" required>' +
      '<label for="l-clave">Contraseña</label><input id="l-clave" type="password" autocomplete="current-password" required>' +
      '<button class="btn" type="submit">Entrar</button><p class="error" id="l-error" role="alert">' + e(error || '') + '</p>' +
      '</form><footer>¿Olvidó su contraseña? Escríbanos por WhatsApp al 614 272 6674.</footer></div>';
    document.getElementById('f-login').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var b = this.querySelector('button'), err = document.getElementById('l-error');
      var correo = document.getElementById('l-correo').value.trim(), clave = document.getElementById('l-clave').value;
      if (!correo || !clave) { err.textContent = 'Escriba su correo y su contraseña.'; return; }
      if (!navigator.onLine) { err.textContent = 'Para entrar la primera vez necesita señal.'; return; }
      b.disabled = true; b.textContent = 'Entrando…'; err.textContent = '';
      var r = await sb.auth.signInWithPassword({ email: correo, password: clave });
      if (r.error) {
        b.disabled = false; b.textContent = 'Entrar';
        err.textContent = /invalid/i.test(r.error.message) ? 'Correo o contraseña incorrectos.' : 'No se pudo entrar. Intente de nuevo.';
        return;
      }
      iniciar();
    });
  }
  async function salir() {
    var sinSubir = S.cola.length + S.rechazados.length;
    if (sinSubir && !confirmar.salir) { confirmar.salir = true; aviso('Hay ' + sinSubir + ' cambios que no están en el servidor y se perderían. Conéctese a señal primero. Toque otra vez solo si quiere salir de todos modos.', true); setTimeout(function () { confirmar.salir = false; }, 4000); return; }
    await sb.auth.signOut();
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('rv:') === 0) localStorage.removeItem(k); }); } catch (x) {}
    location.hash = ''; location.reload();
  }
  var confirmar = {};

  /* ---------- Marco y navegación ---------- */
  function marco(titulo, cuerpo, opciones) {
    opciones = opciones || {};
    var activa = opciones.activa || '', chat = !!opciones.composer, raiz = !opciones.atras && !chat;
    var tab = function (h, ic, t) { return '<a href="#/' + h + '"' + (activa === h ? ' aria-current="page"' : '') + '>' + ico(ic) + '<span>' + t + '</span></a>'; };
    app.innerHTML =
      '<div class="marco' + (chat ? ' chat' : '') + '"><header class="cabeza"><div class="cabeza-fila">' +
      (opciones.atras ? '<button class="btn-icono" id="b-atras" aria-label="Regresar">' + ico('atras') + '</button>' : '<span class="fierro" aria-hidden="true">' + e(iniciales(S.rancho.nombre)) + '</span>') +
      (opciones.avatar || '') +
      '<div class="cabeza-txt"><h1>' + e(raiz ? S.rancho.nombre.replace(/\s*\(.*\)\s*$/, '') : titulo) + '</h1><span class="rancho">' + e(raiz ? titulo : (opciones.sub || '')) + '</span></div>' +
      (opciones.derecha || '') + (activa === 'buscar' || chat ? '' : '<a class="btn-icono" href="#/buscar" aria-label="Buscar en todo">' + ico('buscar') + '</a>') +
      '<span id="red" class="estado-red"></span></div></header>' +
      (raiz ? '<div class="lomas" aria-hidden="true"></div>' : '') +
      '<main class="contenido vista-entra">' + cuerpo + '</main>' +
      (chat ? '<div class="composer">' + opciones.composer + '</div>'
        : '<nav class="tabs" aria-label="Secciones">' + tab('ganado', 'ganado', 'Hato') + (puedeDinero() ? tab('dinero', 'dinero', 'Dinero') : '') + tab('potreros', 'potrero', 'Potreros') + tab('mas', 'menu', 'Más') + '</nav>' +
          '<button class="fab" id="b-registrar" aria-label="Registrar">' + ico('mas') + '</button>') + '</div>';
    pintarRed();
    var reg = document.getElementById('b-registrar');
    if (reg) reg.onclick = menuRegistrar;
    var at = document.getElementById('b-atras');
    if (at) at.onclick = function () { if (history.length > 1) history.back(); else location.hash = opciones.atras; };
    window.scrollTo(0, 0);
  }
  function ruta() {
    if (!S.rancho || !S.datos) return;
    var h = location.hash.replace(/^#\/?/, '').split('/');
    var v = h[0];
    if (v === 'animal' && h[1]) return vistaAnimal(h[1]);
    if (v === 'dinero' && puedeDinero()) return vistaDinero(h[1]);
    if (v === 'estados' && puedeDinero()) return vistaEstados(h[1]);
    if (v === 'historial' && puedeDinero()) return vistaHistorial();
    if (v === 'potreros') return vistaPotreros();
    if (v === 'potrero' && h[1]) return vistaPotrero(h[1]);
    if (v === 'mas') return vistaMas();
    if (v === 'buscar') return vistaBuscar();
    return vistaGanado();
  }
  document.addEventListener('keydown', function (ev) {
    var t = ev.target.tagName;
    if (ev.key === '/' && !hoja.open && t !== 'INPUT' && t !== 'TEXTAREA' && t !== 'SELECT' && S.rancho) { ev.preventDefault(); location.hash = '#/buscar'; }
  });
  window.addEventListener('hashchange', function () { if (hoja.open) hoja.close(); ruta(); });

  /* ---------- Datos derivados ---------- */
  function activos() { return tabla('campo_animales').filter(function (a) { return a.estado === 'activo'; }); }
  function nombrePotrero(id) { var p = id && buscarId('campo_potreros', id); return p ? p.nombre : 'Sin potrero'; }
  function mesDe(f) { return f.slice(0, 7); }
  function finanzasMes(m) { return tabla('campo_finanzas').filter(function (f) { return mesDe(f.fecha) === m; }); }
  function suma(l, tipo) { return l.reduce(function (s, f) { return s + (f.tipo === tipo ? +f.monto : 0); }, 0); }
  function eventosDe(id) {
    return tabla('campo_eventos').filter(function (x) { return x.animal_id === id; })
      .sort(function (a, b) { return b.fecha === a.fecha ? (b.creado_en || '9').localeCompare(a.creado_en || '9') : b.fecha.localeCompare(a.fecha); });
  }
  function ordenArete(a, b) { return a.arete.localeCompare(b.arete, 'es', { numeric: true }); }
  function mesesAtras(hasta, n) {
    var l = [], d = new Date(+hasta.slice(0, 4), +hasta.slice(5, 7) - 1, 1);
    for (var i = n - 1; i >= 0; i--) { var x = new Date(d.getFullYear(), d.getMonth() - i, 1); l.push(x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2)); }
    return l;
  }
  /* Ingresos y gastos de los últimos meses, barras pareadas. oscuro = sobre fondo marina */
  var COLOR_CAT = {
    'Alimento y suplemento': '#FF8A3D', 'Medicinas y vacunas': '#FF5C8A', 'Veterinario': '#B57BFF', 'Mano de obra': '#4DA3FF', 'Combustible': '#FFC53D',
    'Mantenimiento': '#3DD6C6', 'Compra de ganado': '#8BD450', 'Agua y luz': '#5CC8FF', 'Fletes': '#E58CFF', 'Otro': '#9AA4B5',
    'Venta de ganado': '#2BD47D', 'Apoyos y subsidios': '#2BD47D', 'Renta de pasto': '#2BD47D'
  };
  function colorCat(c) { return COLOR_CAT[c] || '#9AA4B5'; }
  /* Ingresos y gastos de los últimos meses, barras pareadas */
  function graficaMeses(hasta, n) {
    var meses = mesesAtras(hasta, n), W = 320, H = 120, base = 98, alto = 84;
    var datos = meses.map(function (m) { var f = finanzasMes(m); return { m: m, i: suma(f, 'ingreso'), g: suma(f, 'gasto') }; });
    var max = Math.max.apply(null, datos.map(function (d) { return Math.max(d.i, d.g); }).concat(1));
    var paso = W / n, ancho = Math.min(12, paso / 3.6), cI = '#2BD47D', cG = '#FF5A3C';
    var s = '<svg class="grafica" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Ingresos y gastos por mes"><line x1="0" x2="' + W + '" y1="' + base + '" y2="' + base + '" stroke="rgba(255,255,255,.12)"/>';
    datos.forEach(function (d, k) {
      var cx = paso * k + paso / 2, hI = d.i / max * alto, hG = d.g / max * alto;
      var mes = new Date(+d.m.slice(0, 4), +d.m.slice(5) - 1, 1).toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
      s += '<g><title>' + mes + ': ingresos ' + pesos(d.i) + ', gastos ' + pesos(d.g) + '</title>' +
        '<rect x="' + (cx - ancho - 1.5) + '" y="' + (base - hI) + '" width="' + ancho + '" height="' + Math.max(hI, d.i ? 2 : 0) + '" rx="3" fill="' + cI + '"/>' +
        '<rect x="' + (cx + 1.5) + '" y="' + (base - hG) + '" width="' + ancho + '" height="' + Math.max(hG, d.g ? 2 : 0) + '" rx="3" fill="' + cG + '"/>' +
        '<text x="' + cx + '" y="' + (H - 4) + '" text-anchor="middle" font-size="11" fill="rgba(255,255,255,.4)">' + mes + '</text></g>';
    });
    return s + '</svg><p class="leyenda-graf"><span><i style="background:' + cI + '"></i>Ingresos</span><span><i style="background:' + cG + '"></i>Gastos</span></p>';
  }
  /* Gasto acumulado día por día de un mes contra el mes anterior */
  function datosCurva(m) {
    var y = +m.slice(0, 4), mm = +m.slice(5, 7), dias = new Date(y, mm, 0).getDate();
    var ant = mesesAtras(m, 2)[0], diasAnt = new Date(+ant.slice(0, 4), +ant.slice(5, 7), 0).getDate();
    var acum = function (mes, n) {
      var porDia = new Array(n + 1).fill(0);
      finanzasMes(mes).forEach(function (f) { if (f.tipo === 'gasto') porDia[Math.min(n, +f.fecha.slice(8, 10))] += +f.monto; });
      for (var k = 1; k <= n; k++) porDia[k] += porDia[k - 1];
      return porDia;
    };
    var esActual = m === hoy().slice(0, 7);
    return { m: m, ant: ant, dias: dias, hasta: esActual ? +hoy().slice(8, 10) : dias, actual: acum(m, dias), previo: acum(ant, diasAnt) };
  }
  function curvaGasto(d) {
    var W = 360, H = 150, top = 26, base = 128, max = Math.max(d.actual[d.hasta], d.previo[d.previo.length - 1], 1);
    var X = function (k) { return (k - 1) / (d.dias - 1) * W; }, Y = function (v) { return base - v / max * (base - top); };
    var linea = function (arr, n) { var p = []; for (var k = 1; k <= n; k++) p.push(X(Math.min(k, d.dias)).toFixed(1) + ',' + Y(arr[k]).toFixed(1)); return p.join(' '); };
    var pts = linea(d.actual, d.hasta);
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gasto acumulado del mes contra el mes anterior">' +
      '<defs><linearGradient id="rv-relleno" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#FF5A3C" stop-opacity=".35"/><stop offset="1" stop-color="#FF5A3C" stop-opacity="0"/></linearGradient></defs>' +
      '<line x1="0" x2="' + W + '" y1="' + base + '" y2="' + base + '" stroke="rgba(255,255,255,.1)"/>' +
      '<polyline points="' + linea(d.previo, Math.min(d.dias, d.previo.length - 1)) + '" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round"/>' +
      '<polygon points="0,' + base + ' ' + pts + ' ' + X(d.hasta).toFixed(1) + ',' + base + '" fill="url(#rv-relleno)"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="#FF5A3C" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle class="curva-fin" cx="' + X(d.hasta).toFixed(1) + '" cy="' + Y(d.actual[d.hasta]).toFixed(1) + '" r="4.5" fill="#FF5A3C" stroke="#050E1F" stroke-width="2"/>' +
      '<line class="curva-guia" x1="0" x2="0" y1="' + top + '" y2="' + base + '" stroke="rgba(255,255,255,.35)" stroke-width="1" visibility="hidden"/>' +
      '<circle class="curva-cursor" r="5" fill="#fff" visibility="hidden"/>' +
      '<text x="0" y="' + (H - 4) + '" font-size="11" fill="rgba(255,255,255,.4)">1</text><text x="' + W + '" y="' + (H - 4) + '" font-size="11" fill="rgba(255,255,255,.4)" text-anchor="end">' + d.dias + '</text></svg>';
  }
  /* Recorrer la curva con el dedo o el mouse para ver cada día */
  function montarCurva(caja, d) {
    var svg = caja.querySelector('svg'), punto = caja.querySelector('.curva-punto'), guia = svg.querySelector('.curva-guia'), cursor = svg.querySelector('.curva-cursor');
    var W = 360, top = 26, base = 128, max = Math.max(d.actual[d.hasta], d.previo[d.previo.length - 1], 1);
    var mesCorto = function (m) { return new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, 1).toLocaleDateString('es-MX', { month: 'short' }).replace('.', ''); };
    var mostrar = function (cx) {
      var r = svg.getBoundingClientRect(), k = Math.max(1, Math.min(d.hasta, Math.round((cx - r.left) / r.width * (d.dias - 1)) + 1));
      var x = (k - 1) / (d.dias - 1) * W, y = base - d.actual[k] / max * (base - top), prev = d.previo[Math.min(k, d.previo.length - 1)];
      guia.setAttribute('x1', x); guia.setAttribute('x2', x); guia.setAttribute('visibility', 'visible');
      cursor.setAttribute('cx', x); cursor.setAttribute('cy', y); cursor.setAttribute('visibility', 'visible');
      punto.hidden = false;
      punto.innerHTML = k + ' ' + mesCorto(d.m) + ' · <b>' + pesos(d.actual[k]) + '</b> · ' + mesCorto(d.ant) + ' ' + pesos(prev);
      var px = x / W * r.width, ancho = punto.offsetWidth;
      punto.style.left = Math.max(ancho / 2 + 8, Math.min(r.width - ancho / 2 - 8, px)) + 'px';
    };
    var ocultar = function () { guia.setAttribute('visibility', 'hidden'); cursor.setAttribute('visibility', 'hidden'); punto.hidden = true; };
    caja.addEventListener('pointerdown', function (ev) { mostrar(ev.clientX); });
    caja.addEventListener('pointermove', function (ev) { if (ev.pointerType === 'mouse' || ev.buttons) mostrar(ev.clientX); });
    caja.addEventListener('pointerleave', ocultar);
    caja.addEventListener('pointerup', function (ev) { if (ev.pointerType !== 'mouse') setTimeout(ocultar, 1600); });
  }
  function bloqueCurva(m) {
    var d = datosCurva(m), g = d.actual[d.hasta], antMismoDia = d.previo[Math.min(d.hasta, d.previo.length - 1)];
    var mesN = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, 1).toLocaleDateString('es-MX', { month: 'long' });
    var antN = new Date(+d.ant.slice(0, 4), +d.ant.slice(5, 7) - 1, 1).toLocaleDateString('es-MX', { month: 'long' });
    var cambio = antMismoDia ? Math.round((g - antMismoDia) / antMismoDia * 100) : null;
    return { d: d, html: '<div class="resumen"><small>Gastado en ' + mesN + '</small><span class="grande">' + pesos(g) + '</span>' +
      (cambio !== null ? '<span class="comparado"><b class="' + (cambio > 0 ? 'sube' : 'baja') + '">' + (cambio > 0 ? '+' : '') + cambio + '%</b>contra ' + antN + ' a estas fechas</span>' : '') + '</div>' +
      '<div class="curva">' + curvaGasto(d) + '<div class="curva-punto" hidden></div></div>' +
      '<p class="curva-leyenda"><span><i style="background:#FF5A3C"></i>' + mesN.replace(/^./, function (c) { return c.toUpperCase(); }) + '</span><span><i style="background:rgba(255,255,255,.35)"></i>' + antN.replace(/^./, function (c) { return c.toUpperCase(); }) + '</span></p>' };
  }
  /* Último registro de cada animal: es lo que se ve en la lista, como el último mensaje de un chat */
  function ultimosEventos() {
    var m = {};
    tabla('campo_eventos').forEach(function (x) {
      var u = m[x.animal_id];
      if (!u || x.fecha > u.fecha || (x.fecha === u.fecha && (x.creado_en || '9') > (u.creado_en || '9'))) m[x.animal_id] = x;
    });
    return m;
  }
  function resumenEvento(x) {
    return (EVENTOS[x.tipo] || EVENTOS.nota)[0] + (x.detalle ? ' · ' + x.detalle : x.peso ? ' · ' + kg(x.peso) : x.monto ? ' · ' + pesos(x.monto) : '');
  }
  function cuando(f) { return f === hoy() ? 'Hoy' : fecha(f, true); }
  function filaAnimal(a, ultimos) {
    var mapa = ultimos && typeof ultimos === 'object' && !Array.isArray(ultimos) ? ultimos : ultimosEventos(), u = mapa[a.id];
    var est = a.estado !== 'activo' ? '<span class="etiqueta ' + (a.estado === 'vendido' ? 'azul' : 'mal') + '">' + (a.estado === 'vendido' ? 'Vendido' : 'Muerto') + '</span>' : '';
    return '<li><a class="fila" href="#/animal/' + a.id + '" data-animal="' + a.id + '"><i class="palomita sel-check" aria-hidden="true"></i>' + avatarAnimal(a) +
      '<span class="fila-cuerpo"><span class="fila-arriba"><b>' + e(a.arete) + ' · ' + e(NOMBRE_CAT[a.categoria]) + (a.nombre ? ' ' + e(a.nombre) : '') + '</b>' +
      (u ? '<time' + (u.fecha === hoy() ? ' class="nuevo"' : '') + '>' + cuando(u.fecha) + '</time>' : '') + '</span>' +
      '<span class="fila-abajo"><span class="fila-sub">' + e(u ? resumenEvento(u) : nombrePotrero(a.potrero_id)) + '</span>' + est + '</span></span></a></li>';
  }
  function filaFija(href, avatar, titulo, sub, globo) {
    return '<li><a class="fila" href="' + href + '">' + avatar + '<span class="fila-cuerpo"><span class="fila-arriba"><b>' + e(titulo) + '</b><time>Hoy</time></span>' +
      '<span class="fila-abajo"><span class="fila-sub">' + e(sub) + '</span>' + (globo ? '<span class="globo mal">' + globo + '</span>' : '<svg class="fijado" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 17v5M9 3h6l-1 6 3 3H7l3-3z"/></svg>') + '</span></span></a></li>';
  }

  /* ---------- Vistas ---------- */
  var filtroGanado = { q: '', cat: '', estado: 'activo', potrero: '' };
  function vistaGanado() {
    var act = activos(), h = act.filter(function (a) { return a.sexo === 'hembra'; }).length;
    var fijos = '';
    if (puedeDinero()) {
      var m = hoy().slice(0, 7), fm = finanzasMes(m), g = suma(fm, 'gasto'), i = suma(fm, 'ingreso');
      fijos += filaFija('#/dinero', '<span class="avatar ingreso">' + ico('dinero') + '</span>', 'Dinero de ' + new Date().toLocaleDateString('es-MX', { month: 'long' }), 'Gastado ' + pesos(g) + ' · balance ' + pesos(i - g));
    }
    tabla('campo_potreros').forEach(function (p) {
      var n = act.filter(function (a) { return a.potrero_id === p.id; }).length;
      if (p.agua === 'sin_agua' && n) fijos += filaFija('#/potrero/' + p.id, '<span class="avatar alerta">' + ico('agua') + '</span>', p.nombre, 'Sin agua · ' + n + ' animales', '!');
    });
    var cats = [['', 'Todos'], ['hembras', 'Hembras'], ['machos', 'Machos']].concat(['vaca', 'vaquilla', 'becerra', 'becerro', 'novillo', 'toro'].map(function (k) { return [k, NOMBRE_CAT[k] + 's']; }));
    var cuerpo =
      '<div class="buscador">' + ico('buscar') + '<input id="g-q" type="search" inputmode="search" placeholder="Buscar arete o nombre" value="' + e(filtroGanado.q) + '" aria-label="Buscar arete o nombre" autocomplete="off"></div>' +
      '<div class="estados-hato" role="group" aria-label="Estado">' + [['activo', 'En el rancho'], ['vendido', 'Vendidos'], ['muerto', 'Bajas']].map(function (c) { return '<button data-est="' + c[0] + '" aria-pressed="' + (filtroGanado.estado === c[0]) + '">' + c[1] + '</button>'; }).join('') + '</div>' +
      '<div class="filtros" role="group" aria-label="Filtros">' +
      '<select id="g-pot" aria-label="Potrero"><option value="">Potreros</option>' + tabla('campo_potreros').slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es', { numeric: true }); }).map(function (p) { return '<option value="' + p.id + '"' + (filtroGanado.potrero === p.id ? ' selected' : '') + '>' + e(p.nombre) + '</option>'; }).join('') + '</select>' +
      '<select id="g-cat" aria-label="Tipo de ganado">' + cats.map(function (c) { return '<option value="' + c[0] + '"' + (filtroGanado.cat === c[0] ? ' selected' : '') + '>' + (c[0] ? c[1] : 'Tipo de ganado') + '</option>'; }).join('') + '</select></div>' +
      '<ul class="lista" id="g-fijos">' + fijos + '</ul><div class="conteo-fila"><p class="conteo" id="g-conteo"></p><button id="g-sel" type="button">Seleccionar</button></div><ul class="lista" id="g-lista"></ul>' +
      '<div class="barra-sel" id="g-barra" hidden><button type="button" class="btn-icono" id="gs-salir" aria-label="Terminar selección">' + ico('cerrar') + '</button><b id="gs-n"></b>' +
      '<button type="button" id="gs-todos">Todos</button><button type="button" class="btn" id="gs-mover">' + ico('mover') + 'Mover</button><button type="button" class="btn sec" id="gs-tratar" aria-label="Vacunar">' + ico('jeringa') + '</button></div>';
    marco('Hato · ' + act.length + ' cabezas · ' + h + ' hembras', cuerpo, { activa: 'ganado', derecha: '<button class="btn-icono" id="b-voz" aria-label="Dictar al ganado">' + ico('mic') + '</button>' });
    document.getElementById('b-voz').onclick = function () { dictarGanado(); };
    var ultimos = ultimosEventos(), clave = function (a) { var u = ultimos[a.id]; return u ? u.fecha + (u.creado_en || '9') : ''; };
    var visibles = [];
    // Selección de varios animales (como en WhatsApp): botón "Seleccionar" o dejar presionado un animal.
    var sel = null, lista = document.getElementById('g-lista'), barra = document.getElementById('g-barra');
    var pintarSel = function () {
      var activo = !!sel, n = sel ? Object.keys(sel).length : 0;
      lista.classList.toggle('seleccionando', activo); barra.hidden = !activo;
      var fab = document.getElementById('b-registrar'); if (fab) fab.hidden = activo;
      document.getElementById('g-sel').textContent = activo ? 'Listo' : 'Seleccionar';
      lista.querySelectorAll('[data-animal]').forEach(function (r) { r.classList.toggle('marcado', !!(sel && sel[r.dataset.animal])); });
      if (!activo) return;
      document.getElementById('gs-n').textContent = n + (n === 1 ? ' animal' : ' animales');
      var todos = visibles.length && visibles.every(function (a) { return sel[a.id]; });
      document.getElementById('gs-todos').textContent = todos ? 'Ninguno' : 'Todos';
      document.getElementById('gs-mover').disabled = document.getElementById('gs-tratar').disabled = !n;
    };
    var alternar = function (id) { if (!sel) sel = {}; if (sel[id]) delete sel[id]; else sel[id] = 1; pintarSel(); };
    document.getElementById('g-sel').onclick = function () { sel = sel ? null : {}; pintarSel(); };
    document.getElementById('gs-salir').onclick = function () { sel = null; pintarSel(); };
    document.getElementById('gs-todos').onclick = function () {
      var todos = visibles.every(function (a) { return sel[a.id]; });
      visibles.forEach(function (a) { if (todos) delete sel[a.id]; else sel[a.id] = 1; }); pintarSel();
    };
    var elegidos = function () { return Object.keys(sel || {}).map(function (id) { return buscarId('campo_animales', id); }).filter(function (a) { return a && a.estado === 'activo'; }); };
    document.getElementById('gs-mover').onclick = function () { formSeleccion('mover', elegidos(), function () { sel = null; }); };
    document.getElementById('gs-tratar').onclick = function () { formSeleccion('tratar', elegidos(), function () { sel = null; }); };
    var presion = null, largo = false;
    lista.addEventListener('pointerdown', function (ev) {
      var r = ev.target.closest('[data-animal]'); if (!r || filtroGanado.estado !== 'activo') return;
      largo = false; clearTimeout(presion);
      presion = setTimeout(function () { largo = true; if (navigator.vibrate) navigator.vibrate(15); if (!sel) sel = {}; sel[r.dataset.animal] = 1; pintarSel(); }, 450);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { lista.addEventListener(t, function () { clearTimeout(presion); }); });
    lista.addEventListener('scroll', function () { clearTimeout(presion); }, true);
    var x0 = 0, y0 = 0;
    lista.addEventListener('pointerdown', function (ev) { x0 = ev.clientX; y0 = ev.clientY; });
    lista.addEventListener('pointermove', function (ev) { if (Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) > 10) clearTimeout(presion); });
    lista.addEventListener('contextmenu', function (ev) { if (ev.target.closest('[data-animal]')) ev.preventDefault(); });
    lista.addEventListener('click', function (ev) {
      var r = ev.target.closest('[data-animal]'); if (!r) return;
      if (largo) { ev.preventDefault(); largo = false; return; }
      if (sel) { ev.preventDefault(); alternar(r.dataset.animal); }
    });
    var pintar = function () {
      var q = filtroGanado.q.trim().toLowerCase(), c = filtroGanado.cat;
      var l = tabla('campo_animales').filter(function (a) {
        if (a.estado !== filtroGanado.estado) return false;
        if (filtroGanado.potrero && a.potrero_id !== filtroGanado.potrero) return false;
        if (c === 'hembras' && a.sexo !== 'hembra') return false;
        if (c === 'machos' && a.sexo !== 'macho') return false;
        if (c && c !== 'hembras' && c !== 'machos' && a.categoria !== c) return false;
        return !q || a.arete.toLowerCase().indexOf(q) > -1 || (a.nombre || '').toLowerCase().indexOf(q) > -1;
      }).sort(function (a, b) { return clave(b).localeCompare(clave(a)) || ordenArete(a, b); });
      document.getElementById('g-fijos').hidden = !!(q || c || filtroGanado.potrero || filtroGanado.estado !== 'activo');
      document.getElementById('g-conteo').textContent = l.length + (l.length === 1 ? ' animal' : ' animales');
      visibles = l.slice(0, 400);
      document.getElementById('g-sel').hidden = filtroGanado.estado !== 'activo' || !l.length;
      if (filtroGanado.estado !== 'activo') sel = null;
      document.getElementById('g-lista').innerHTML = l.length ? l.slice(0, 400).map(function (a) { return filaAnimal(a, ultimos); }).join('') + (l.length > 400 ? '<li class="vacio">Mostrando 400. Use el buscador para encontrar los demás.</li>' : '')
        : '<li class="vacio"><b>Sin resultados</b>' + (tabla('campo_animales').length ? 'Pruebe con otro filtro.' : 'Toque el botón + para registrar su primer animal, o díctelo con el micrófono.') + '</li>';
      pintarSel();
    };
    document.getElementById('g-q').oninput = function () { filtroGanado.q = this.value; pintar(); };
    document.getElementById('g-pot').onchange = function () { filtroGanado.potrero = this.value; pintar(); };
    var marcarFiltros = function () { app.querySelectorAll('.filtros select').forEach(function (s) { s.classList.toggle('activo', !!s.value); }); };
    document.getElementById('g-cat').onchange = function () { filtroGanado.cat = this.value; marcarFiltros(); pintar(); };
    app.querySelectorAll('[data-est]').forEach(function (b) { b.onclick = function () { filtroGanado.estado = b.getAttribute('data-est'); app.querySelectorAll('[data-est]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); pintar(); }; });
    document.getElementById('g-pot').addEventListener('change', marcarFiltros);
    marcarFiltros();
    pintar();
  }

  /* Cada animal es una conversación: su historia como mensajes y abajo se escribe o se dicta */
  function etiquetaDia(f) {
    var ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
    var y = ayer.getFullYear() + '-' + ('0' + (ayer.getMonth() + 1)).slice(-2) + '-' + ('0' + ayer.getDate()).slice(-2);
    return f === hoy() ? 'Hoy' : f === y ? 'Ayer' : fecha(f);
  }
  function vistaAnimal(id) {
    var a = buscarId('campo_animales', id);
    if (!a) { marco('Animal', '<div class="vacio"><b>No se encontró</b>Puede que se haya borrado.<br><a class="btn sec" href="#/ganado">Ir al hato</a></div>', { atras: '#/ganado', activa: 'ganado' }); return; }
    var madre = a.madre_id && buscarId('campo_animales', a.madre_id);
    var crias = tabla('campo_animales').filter(function (x) { return x.madre_id === a.id; }).sort(ordenArete);
    var desc = eventosDe(a.id), asc = desc.slice().reverse(), activo = a.estado === 'activo';
    var pesajes = desc.filter(function (x) { return x.tipo === 'pesaje' || (x.peso && x.tipo !== 'venta'); }), gan = '';
    if (pesajes.length > 1) {
      var dias = (new Date(pesajes[0].fecha) - new Date(pesajes[1].fecha)) / 864e5;
      if (dias > 0) gan = ((pesajes[0].peso - pesajes[1].peso) / dias).toLocaleString('es-MX', { maximumFractionDigits: 2 }) + ' kg/día';
    }
    var datos = [['Peso', a.peso ? kg(a.peso) : ''], ['Edad', edad(a.nacimiento)], ['Potrero', e(nombrePotrero(a.potrero_id))], ['Ganancia', gan],
      ['Madre', madre ? '<a href="#/animal/' + madre.id + '">' + e(madre.arete) + '</a>' : ''],
      ['Crías', crias.map(function (c) { return '<a href="#/animal/' + c.id + '">' + e(c.arete) + '</a>'; }).join(', ')]].filter(function (d) { return d[1]; });
    var hilo = '', dia = '';
    asc.forEach(function (x) {
      if (x.fecha !== dia) { dia = x.fecha; hilo += '<li class="dia">' + etiquetaDia(dia) + '</li>'; }
      var t = EVENTOS[x.tipo] || EVENTOS.nota, extra = [x.peso ? kg(x.peso) : '', x.monto ? pesos(x.monto) : '', x.detalle ? e(x.detalle) : ''].filter(Boolean).join(' · ');
      hilo += '<li class="burbuja' + (x.tipo === 'alta' ? ' sistema' : '') + '"><span class="ico">' + ico(t[1]) + '</span><b>' + t[0] + '</b>' + (extra ? '<p>' + extra + '</p>' : '<p></p>') + '</li>';
    });
    var cuerpo =
      '<div class="contacto">' + avatarAnimal(a) + '<h2>' + e(a.arete) + '</h2><p>' + e(NOMBRE_CAT[a.categoria]) + (a.raza ? ' · ' + e(a.raza) : '') + (a.color ? ' · ' + e(a.color) : '') + (a.nombre ? ' · ' + e(a.nombre) : '') +
      (activo ? '' : ' <span class="etiqueta ' + (a.estado === 'vendido' ? 'azul' : 'mal') + '">' + (a.estado === 'vendido' ? 'Vendido' : 'Muerto') + '</span>') + '</p>' +
      (datos.length ? '<div class="contacto-datos">' + datos.map(function (d) { return '<span>' + d[0] + ' <b>' + d[1] + '</b></span>'; }).join('') + '</div>' : '') + '</div>' +
      '<ul class="hilo">' + (hilo || '<li class="dia">Sin registros todavía</li>') + '</ul>';
    var composer =
      '<button class="btn-icono" id="c-clip" type="button" aria-label="Acciones para este animal">' + ico('clip') + '</button>' +
      '<form id="c-form" autocomplete="off"><input id="c-txt" placeholder="' + (activo ? 'Escriba lo que pasó…' : 'Agregar una nota…') + '" aria-label="Escriba lo que pasó con este animal" enterkeyhint="send"></form>' +
      '<button class="redondo" id="c-btn" type="button" aria-label="Dictar">' + ico('mic') + '</button>';
    marco('Arete ' + a.arete, cuerpo, { atras: '#/ganado', activa: 'ganado', sub: NOMBRE_CAT[a.categoria] + ' · ' + nombrePotrero(a.potrero_id), avatar: avatarAnimal(a, 'chico cabeza-avatar'),
      derecha: '<button class="btn-icono" id="b-editar" aria-label="Editar ficha">' + ico('editar') + '</button>', composer: composer });
    window.scrollTo(0, document.documentElement.scrollHeight);
    document.getElementById('b-editar').onclick = function () { formAnimal(a); };
    document.getElementById('c-clip').onclick = function () { accionesAnimal(a); };
    var txt = document.getElementById('c-txt'), btn = document.getElementById('c-btn');
    var ajustar = function () { var hay = !!txt.value.trim(); btn.innerHTML = ico(hay ? 'enviar' : 'mic'); btn.setAttribute('aria-label', hay ? 'Enviar' : 'Dictar'); };
    var enviar = function () { var t = txt.value.trim(); if (t) enviarTexto(a, t, btn); else dictarGanado(a.arete); };
    txt.oninput = ajustar;
    document.getElementById('c-form').onsubmit = function (ev) { ev.preventDefault(); enviar(); };
    btn.onclick = enviar;
  }
  function accionesAnimal(a) {
    var activo = a.estado === 'activo';
    var acciones = activo ? [['pesar', 'bascula', 'Pesar'], ['tratar', 'jeringa', 'Vacuna']]
      .concat(a.sexo === 'hembra' && a.categoria !== 'becerra' ? [['parto', 'cria', 'Parto'], ['prenez', 'prenez', 'Preñez']] : [])
      .concat(a.categoria === 'becerra' || a.categoria === 'becerro' ? [['destete', 'bascula', 'Destete']] : [])
      .concat([['mover', 'mover', 'Mover'], ['nota', 'nota', 'Nota'], ['vender', 'vender', 'Vender'], ['baja', 'baja', 'Baja']]) : [['nota', 'nota', 'Nota']];
    abrirHoja('Arete ' + a.arete, '<div class="botonera">' + acciones.map(function (x) { return '<button type="button" class="boton-accion" data-acc="' + x[0] + '">' + ico(x[1]) + x[2] + '</button>'; }).join('') + '</div>', '');
    hoja.querySelectorAll('[data-acc]').forEach(function (b) {
      b.onclick = function () { ({ pesar: formPesaje, tratar: formTratamiento, parto: formParto, prenez: formPrenez, destete: formDestete, mover: formMover, nota: formNota, vender: formVenta, baja: formBaja })[b.dataset.acc](a); };
    });
  }
  /* Lo que se escribe en la conversación se interpreta; si no hay señal o no se entiende, queda como nota */
  async function enviarTexto(a, texto, btn) {
    var comoNota = function (msg) { evento(a, 'nota', { detalle: texto }); aviso(msg); ruta(); subir(); };
    if (!navigator.onLine) return comoNota('Sin señal: se guardó como nota.');
    btn.disabled = true; btn.innerHTML = '<span class="girando" style="width:20px;height:20px;margin:0;border-width:2px"></span>';
    try {
      var r = await leerConIA('texto-ganado', null, '', { texto: texto, arete: a.arete, potreros: JSON.stringify(tabla('campo_potreros').map(function (p) { return p.nombre; })) });
      if (!r.acciones || !r.acciones.length) return comoNota('Guardado como nota.');
      r.escrito = true;
      confirmarAcciones(r);
      btn.disabled = false; btn.innerHTML = ico('mic');
    } catch (x) { comoNota('No se pudo interpretar: se guardó como nota.'); }
  }

  function vistaDinero(mesParam) {
    var m = /^\d{4}-\d{2}$/.test(mesParam || '') ? mesParam : hoy().slice(0, 7);
    var d = new Date(+m.slice(0, 4), +m.slice(5) - 1, 1);
    var mover = function (n) { var x = new Date(d.getFullYear(), d.getMonth() + n, 1); return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2); };
    var l = finanzasMes(m).sort(function (a, b) { return b.fecha.localeCompare(a.fecha) || (b.creado_en || '9').localeCompare(a.creado_en || '9'); });
    var g = suma(l, 'gasto'), i = suma(l, 'ingreso'), cab = activos().length;
    var porCat = {}; l.filter(function (f) { return f.tipo === 'gasto'; }).forEach(function (f) { porCat[f.categoria] = (porCat[f.categoria] || 0) + +f.monto; });
    var cats = Object.keys(porCat).sort(function (a, b) { return porCat[b] - porCat[a]; }), max = cats.length ? porCat[cats[0]] : 1;
    var anio = m.slice(0, 4), fa = tabla('campo_finanzas').filter(function (f) { return f.fecha.slice(0, 4) === anio; });
    var balAnio = suma(fa, 'ingreso') - suma(fa, 'gasto');
    var curva = bloqueCurva(m);
    var cuerpo =
      '<div class="captura-linea"><form id="d-form" autocomplete="off"><input id="d-txt" placeholder="Escriba un gasto: diésel 2350" aria-label="Escriba un gasto o ingreso" enterkeyhint="send">' +
      '<button type="button" class="btn-icono" data-cap="ticket" aria-label="Foto de ticket">' + ico('foto') + '</button></form>' +
      '<button type="button" class="redondo" id="d-btn" aria-label="Dictar">' + ico('mic') + '</button></div>' +
      '<a class="fila enlace-estados" href="#/estados/' + m.slice(0, 4) + '"><span class="avatar">' + ico('reporte') + '</span><span class="fila-cuerpo"><span class="fila-titulo">Estados financieros</span><span class="fila-sub">Resultados, valor del hato y flujo · PDF</span></span><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></a>' +
      '<div class="mes"><a class="btn-icono" href="#/dinero/' + mover(-1) + '" aria-label="Mes anterior">' + ico('atras') + '</a><b>' + d.toLocaleDateString('es-MX', { month: 'long' }).replace(/^./, function (c) { return c.toUpperCase(); }) + ' ' + d.getFullYear() + '</b>' +
      '<a class="btn-icono" href="#/dinero/' + mover(1) + '" aria-label="Mes siguiente">' + ico('chev') + '</a></div>' +
      curva.html +
      '<div class="cifras cuatro" style="margin-top:18px">' +
      '<div class="cifra"><small>Ingresos</small><b class="num verde">' + pesos(i) + '</b></div>' +
      '<div class="cifra"><small>Gasto por cabeza</small><b class="num">' + (cab ? pesos(g / cab) : '—') + '</b></div>' +
      '<div class="cifra"><small>Balance del mes</small><b class="num ' + (i - g < 0 ? 'rojo' : 'verde') + '">' + pesos(i - g) + '</b></div>' +
      '<div class="cifra"><small>Balance ' + anio + '</small><b class="num ' + (balAnio < 0 ? 'rojo' : 'verde') + '">' + pesos(balAnio) + '</b></div></div>' +
      (cats.length ? '<section class="seccion"><div class="seccion-titulo"><h2>En qué se fue</h2></div><div class="panel"><div class="barras">' + cats.map(function (c) {
        return '<div class="barra-fila"><span><i style="background:' + colorCat(c) + '"></i>' + e(c) + '</span><b>' + pesos(porCat[c]) + '</b><i style="width:' + (porCat[c] / max * 100) + '%;background:' + colorCat(c) + '"></i></div>';
      }).join('') + '</div></div></section>' : '') +
      '<section class="seccion"><div class="seccion-titulo"><h2>Últimos 6 meses</h2></div><div class="panel panel-graf">' + graficaMeses(m, 6) + '</div></section>' +
      '<section class="seccion"><div class="seccion-titulo"><h2>Movimientos</h2><button id="b-nuevo-mov">+ Agregar</button></div><div class="panel"><ul class="lista">' +
      (l.length ? l.map(function (f) {
        return '<li><button class="fila" data-id="' + f.id + '"><span class="avatar ' + f.tipo + '">' + ico(f.ticket_path ? 'foto' : f.tipo) + '</span><span class="fila-cuerpo"><span class="fila-titulo">' + e(f.concepto || f.categoria) + '</span><span class="fila-sub">' + e(f.categoria) + (f.proveedor ? ' · ' + e(f.proveedor) : '') + (f.ticket_path ? ' · con ticket' : '') + '</span></span>' +
          '<span class="fila-der"><b class="num" style="color:' + (f.tipo === 'gasto' ? 'var(--gasto)' : 'var(--ingreso)') + '">' + (f.tipo === 'gasto' ? '−' : '+') + pesos(f.monto) + '</b><small>' + fecha(f.fecha, true) + '</small></span></button></li>';
      }).join('') : '<li class="vacio"><b>Sin movimientos este mes</b>Registre gastos e ingresos para ver en qué se va el dinero.</li>') +
      '</ul></div></section>';
    marco('Dinero', cuerpo, { activa: 'dinero' });
    montarCurva(app.querySelector('.curva'), curva.d);
    document.getElementById('b-nuevo-mov').onclick = function () { formDinero(null, 'gasto'); };
    app.querySelector('[data-cap=ticket]').onclick = capturarTicket;
    var dTxt = document.getElementById('d-txt'), dBtn = document.getElementById('d-btn');
    dTxt.oninput = function () { var hay = !!dTxt.value.trim(); dBtn.innerHTML = ico(hay ? 'enviar' : 'mic'); dBtn.setAttribute('aria-label', hay ? 'Enviar' : 'Dictar'); };
    var capturar = function () { var t = dTxt.value.trim(); if (t) interpretarDinero(t, dBtn); else dictar(); };
    document.getElementById('d-form').onsubmit = function (ev) { ev.preventDefault(); capturar(); };
    dBtn.onclick = capturar;
    app.querySelectorAll('[data-id]').forEach(function (b) { b.onclick = function () { formDinero(buscarId('campo_finanzas', b.getAttribute('data-id'))); }; });
  }

  /* ---------- Estados financieros (reporte de gestión, no contable) ---------- */
  var PESO_TIPICO = { vaca: 450, toro: 650, vaquilla: 320, novillo: 350, becerra: 170, becerro: 180 };
  function clavePrecio() { return 'rv:preciokg:' + S.rancho.id; }
  function precioKg() { try { var p = +localStorage.getItem(clavePrecio()); return p > 0 ? p : 60; } catch (x) { return 60; } }
  function periodo(c) {
    var y = +c.slice(0, 4), meses = [], tipo, nombre, previo;
    var mm = function (yy, m) { return yy + '-' + ('0' + m).slice(-2); };
    if (/^\d{4}-T[1-4]$/.test(c)) {
      var q = +c.slice(6); tipo = 't';
      for (var k = 1; k <= 3; k++) meses.push(mm(y, (q - 1) * 3 + k));
      nombre = ['Ene–Mar', 'Abr–Jun', 'Jul–Sep', 'Oct–Dic'][q - 1] + ' ' + y;
      previo = q > 1 ? y + '-T' + (q - 1) : (y - 1) + '-T4';
    } else if (/^\d{4}-\d{2}$/.test(c)) {
      tipo = 'm'; meses.push(c);
      nombre = new Date(y, +c.slice(5) - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).replace(/^./, function (x) { return x.toUpperCase(); });
      var d = new Date(y, +c.slice(5) - 2, 1); previo = mm(d.getFullYear(), d.getMonth() + 1);
    } else {
      tipo = 'a'; for (var j = 1; j <= 12; j++) meses.push(mm(y, j));
      nombre = 'Año ' + y; previo = String(y - 1);
    }
    var sig = tipo === 'a' ? String(y + 1) : tipo === 't' ? (+c.slice(6) < 4 ? y + '-T' + (+c.slice(6) + 1) : (y + 1) + '-T1') : (function () { var d = new Date(y, +c.slice(5), 1); return mm(d.getFullYear(), d.getMonth() + 1); })();
    return { clave: c, tipo: tipo, meses: meses, nombre: nombre, previo: previo, siguiente: sig, desde: meses[0] + '-01', hasta: meses[meses.length - 1] + '-31' };
  }
  function resultados(p) {
    var l = tabla('campo_finanzas').filter(function (f) { return p.meses.indexOf(mesDe(f.fecha)) > -1; });
    var cats = function (tipo) {
      var o = {}; l.filter(function (f) { return f.tipo === tipo; }).forEach(function (f) { o[f.categoria] = (o[f.categoria] || 0) + +f.monto; });
      return Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }).map(function (c) { return [c, o[c]]; });
    };
    var i = suma(l, 'ingreso'), g = suma(l, 'gasto');
    return { l: l, ing: cats('ingreso'), gas: cats('gasto'), i: i, g: g, u: i - g, margen: i ? (i - g) / i * 100 : null };
  }
  function vistaEstados(param) {
    var c = /^\d{4}(-T[1-4]|-\d{2})?$/.test(param || '') ? param : hoy().slice(0, 4);
    var p = periodo(c), r = resultados(p), ant = resultados(periodo(p.previo));
    var y = c.slice(0, 4), mesHoy = hoy().slice(0, 7), triHoy = y + '-T' + (Math.floor((+mesHoy.slice(5) - 1) / 3) + 1);
    var enRango = function (f) { return f >= p.desde && f <= p.hasta; };
    var ev = tabla('campo_eventos').filter(function (x) { return enRango(x.fecha); });
    var cuenta = function (t) { return ev.filter(function (x) { return x.tipo === t; }).length; };
    var destetes = ev.filter(function (x) { return x.tipo === 'destete' && x.peso; });
    var act = activos(), cab = act.length, pk = precioKg();
    var porCat = {}; act.forEach(function (a) {
      var o = porCat[a.categoria] || (porCat[a.categoria] = { n: 0, kg: 0 });
      o.n++; o.kg += +a.peso > 0 ? +a.peso : PESO_TIPICO[a.categoria] || 300;
    });
    var kgTot = Object.keys(porCat).reduce(function (s, k) { return s + porCat[k].kg; }, 0);
    var delta = function (a, b, inverso) {
      if (!b) return '';
      var d = (a - b) / Math.abs(b) * 100, bueno = inverso ? d <= 0 : d >= 0;
      return '<span class="delta ' + (bueno ? 'bien' : 'mal') + '">' + (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d).toFixed(0) + '% vs. periodo anterior</span>';
    };
    var renglones = function (l, total) {
      return l.length ? l.map(function (x) { return '<tr><td><i style="background:' + colorCat(x[0]) + '"></i>' + e(x[0]) + '</td><td class="num">' + pesos(x[1]) + '</td><td class="pct">' + (total ? (x[1] / total * 100).toFixed(0) + '%' : '') + '</td></tr>'; }).join('')
        : '<tr><td colspan="3" class="nada">Sin registros en el periodo</td></tr>';
    };
    var primero = r.l.reduce(function (s, f) { var m = mesDe(f.fecha); return m < s ? m : s; }, '9999');
    var acumulado = 0, flujo = p.meses.filter(function (m) { return m <= mesHoy && m >= primero; }).map(function (m) {
      var f = finanzasMes(m), i = suma(f, 'ingreso'), g = suma(f, 'gasto'); acumulado += i - g;
      return '<tr><td>' + new Date(+m.slice(0, 4), +m.slice(5) - 1, 1).toLocaleDateString('es-MX', { month: 'short' }).replace('.', '') + '</td><td class="num verde">' + pesos(i) + '</td><td class="num rojo">' + pesos(g) + '</td><td class="num ' + (i - g < 0 ? 'rojo' : '') + '">' + pesos(i - g) + '</td><td class="num ' + (acumulado < 0 ? 'rojo' : '') + '">' + pesos(acumulado) + '</td></tr>';
    }).join('');
    var tabP = function (t, clave, txt) { return '<a href="#/estados/' + clave + '" aria-pressed="' + (p.tipo === t) + '">' + txt + '</a>'; };
    var cuerpo =
      '<div class="solo-imprimir enc-impr"><span class="fierro">' + e(iniciales(S.rancho.nombre)) + '</span><div><b>' + e(S.rancho.nombre) + '</b><span>Estados financieros · ' + p.nombre + '</span><small>Generado el ' + fecha(hoy()) + '</small></div></div>' +
      '<div class="no-imprimir periodos segmento">' + tabP('m', y === mesHoy.slice(0, 4) ? mesHoy : y + '-12', 'Mes') + tabP('t', y === mesHoy.slice(0, 4) ? triHoy : y + '-T4', 'Trimestre') + tabP('a', y, 'Año') + '</div>' +
      '<div class="mes no-imprimir"><a class="btn-icono" href="#/estados/' + p.previo + '" aria-label="Periodo anterior">' + ico('atras') + '</a><b>' + p.nombre + '</b><a class="btn-icono" href="#/estados/' + p.siguiente + '" aria-label="Periodo siguiente">' + ico('chev') + '</a></div>' +
      '<div class="cifras cuatro edo-cifras">' +
      '<div class="cifra"><small>Ingresos</small><b class="num verde">' + pesos(r.i) + '</b>' + delta(r.i, ant.i) + '</div>' +
      '<div class="cifra"><small>Gastos</small><b class="num rojo">' + pesos(r.g) + '</b>' + delta(r.g, ant.g, true) + '</div>' +
      '<div class="cifra"><small>Utilidad</small><b class="num ' + (r.u < 0 ? 'rojo' : 'verde') + '">' + pesos(r.u) + '</b>' + (ant.u ? '<span>Antes: ' + pesos(ant.u) + '</span>' : '') + '</div>' +
      '<div class="cifra"><small>Margen</small><b class="num">' + (r.margen == null ? '—' : r.margen.toFixed(0).replace('-', '−') + '%') + '</b><span>De cada $100 que entran</span></div></div>' +
      '<section class="seccion"><div class="seccion-titulo"><h2>Estado de resultados</h2></div><div class="tabla-edo"><table>' +
      '<thead><tr><th>Ingresos</th><th class="num">Monto</th><th class="pct">%</th></tr></thead><tbody>' + renglones(r.ing, r.i) +
      '<tr class="total"><td>Total ingresos</td><td class="num">' + pesos(r.i) + '</td><td></td></tr></tbody>' +
      '<thead><tr><th>Gastos</th><th class="num">Monto</th><th class="pct">%</th></tr></thead><tbody>' + renglones(r.gas, r.g) +
      '<tr class="total"><td>Total gastos</td><td class="num">' + pesos(r.g) + '</td><td></td></tr></tbody>' +
      '<tbody><tr class="final"><td>Utilidad del periodo</td><td class="num ' + (r.u < 0 ? 'rojo' : 'verde') + '">' + pesos(r.u) + '</td><td class="pct">' + (r.margen == null ? '' : r.margen.toFixed(0).replace('-', '−') + '%') + '</td></tr></tbody></table></div></section>' +
      '<section class="seccion"><div class="seccion-titulo"><h2>Indicadores del hato</h2></div><div class="cifras cuatro">' +
      '<div class="cifra"><small>Cabezas hoy</small><b class="num">' + cab + '</b></div>' +
      '<div class="cifra"><small>Costo por cabeza</small><b class="num">' + (cab ? pesos(r.g / cab) : '—') + '</b><span>En el periodo</span></div>' +
      '<div class="cifra"><small>Nacimientos</small><b class="num">' + cuenta('parto') + '</b><span>' + cuenta('compra') + ' compradas · ' + cuenta('venta') + ' vendidas</span></div>' +
      '<div class="cifra"><small>Destete promedio</small><b class="num">' + (destetes.length ? kg(destetes.reduce(function (s, x) { return s + +x.peso; }, 0) / destetes.length) : '—') + '</b><span>' + destetes.length + ' destetes · ' + cuenta('muerte') + ' muertes</span></div></div></section>' +
      '<section class="seccion"><div class="seccion-titulo"><h2>Valor estimado del hato</h2><button class="no-imprimir" id="b-precio">Precio: ' + pesos(pk) + '/kg</button></div><div class="tabla-edo"><table>' +
      '<thead><tr><th>Categoría</th><th class="num">Cabezas</th><th class="num">Kilos</th><th class="num">Valor</th></tr></thead><tbody>' +
      (Object.keys(porCat).length ? Object.keys(porCat).sort(function (a, b) { return porCat[b].kg - porCat[a].kg; }).map(function (k) {
        return '<tr><td>' + NOMBRE_CAT[k] + '</td><td class="num">' + porCat[k].n + '</td><td class="num">' + Math.round(porCat[k].kg).toLocaleString('es-MX') + '</td><td class="num">' + pesos(porCat[k].kg * pk) + '</td></tr>';
      }).join('') : '<tr><td colspan="4" class="nada">Sin animales activos</td></tr>') +
      '<tr class="final"><td>Total</td><td class="num">' + cab + '</td><td class="num">' + Math.round(kgTot).toLocaleString('es-MX') + '</td><td class="num">' + pesos(kgTot * pk) + '</td></tr></tbody></table>' +
      '<p class="nota-edo">Con el último peso de cada animal; si no tiene, se usa un peso típico de su categoría. Precio en pie de ' + pesos(pk) + '/kg.</p></div></section>' +
      (flujo ? '<section class="seccion"><div class="seccion-titulo"><h2>Flujo de efectivo</h2></div><div class="tabla-edo"><table>' +
        '<thead><tr><th>Mes</th><th class="num">Entró</th><th class="num">Salió</th><th class="num">Neto</th><th class="num">Acumulado</th></tr></thead><tbody>' + flujo + '</tbody></table></div></section>' : '') +
      '<div class="no-imprimir acciones-edo"><button class="btn ancho" id="b-pdf">' + ico('descargar') + ' Descargar PDF</button></div>' +
      '<p class="nota-edo legal">Reporte de gestión con los registros capturados en Rancho Vivo. No sustituye la contabilidad fiscal ni los estados financieros de su contador.</p>';
    marco('Estados financieros', cuerpo, { atras: '#/dinero', activa: 'dinero', sub: S.rancho.nombre });
    document.getElementById('b-pdf').onclick = function () {
      var t = document.title; document.title = 'Estados ' + S.rancho.nombre + ' ' + p.nombre;
      window.print(); setTimeout(function () { document.title = t; }, 500);
    };
    document.getElementById('b-precio').onclick = function () {
      abrirHoja('Precio del ganado en pie',
        campo('fp-precio', 'Pesos por kilo', entrada('fp-precio', 'number', pk, ' inputmode="decimal" min="1" step="any" required'), 'Use el precio de la subasta o del comprador de su zona.'),
        '<button type="submit" class="btn ancho">Guardar precio</button>',
        function (f) {
          f.onsubmit = function (ev) {
            ev.preventDefault(); limpiarErrores();
            var n = num(v('fp-precio')); if (!(n > 0 && n < 1000)) return marcarError('fp-precio', 'Revise el precio.');
            try { localStorage.setItem(clavePrecio(), n); } catch (x) { }
            hoja.close(); aviso('Precio actualizado.'); ruta();
          };
        });
    };
  }

  /* ---------- Historial de cambios (lo escribe la base de datos; aquí solo se lee) ---------- */
  var CAMPOS_HIST = {
    campo_animales: { arete: 'Arete', nombre: 'Nombre', sexo: 'Sexo', categoria: 'Tipo', raza: 'Raza', color: 'Color', potrero_id: 'Potrero', peso: 'Peso', estado: 'Estado', nacimiento: 'Nacimiento', madre_id: 'Madre', notas: 'Notas' },
    campo_finanzas: { tipo: 'Tipo', categoria: 'Categoría', concepto: 'Concepto', monto: 'Monto', fecha: 'Fecha', proveedor: 'Proveedor' },
    campo_eventos: { tipo: 'Registro', fecha: 'Fecha', peso: 'Peso', monto: 'Monto', detalle: 'Detalle' },
    campo_potreros: { nombre: 'Nombre', hectareas: 'Hectáreas', agua: 'Agua', notas: 'Notas' }
  };
  function valorHist(campo, x) {
    if (x == null || x === '') return '—';
    if (campo === 'potrero_id') return nombrePotrero(x);
    if (campo === 'madre_id') { var m = buscarId('campo_animales', x); return m ? 'arete ' + m.arete : '—'; }
    if (campo === 'peso') return kg(x);
    if (campo === 'monto') return pesos(x);
    if (campo === 'fecha' || campo === 'nacimiento') return fecha(x, true);
    if (campo === 'categoria' && NOMBRE_CAT[x]) return NOMBRE_CAT[x];
    if (campo === 'agua' && AGUA[x]) return AGUA[x][0];
    if (campo === 'estado') return ({ activo: 'En el rancho', vendido: 'Vendido', muerto: 'Baja' })[x] || x;
    if (campo === 'tipo' && EVENTOS[x]) return EVENTOS[x][0];
    if (campo === 'tipo') return x === 'gasto' ? 'Gasto' : x === 'ingreso' ? 'Ingreso' : x;
    return String(x);
  }
  function describirHist(h) {
    var f = h.despues || h.antes || {}, que, enlace = null;
    if (h.tabla === 'campo_eventos') {
      var an = buscarId('campo_animales', f.animal_id);
      que = (EVENTOS[f.tipo] ? EVENTOS[f.tipo][0] : 'Registro') + (an ? ' · arete ' + an.arete : '') + (f.peso ? ' · ' + kg(f.peso) : '') + (f.monto ? ' · ' + pesos(f.monto) : '') + (f.detalle ? ' · ' + f.detalle : '');
      if (an) enlace = '#/animal/' + an.id;
    } else if (h.tabla === 'campo_animales') {
      que = 'Animal arete ' + (f.arete || '') + (f.categoria && NOMBRE_CAT[f.categoria] ? ' (' + NOMBRE_CAT[f.categoria] + ')' : '');
      if (buscarId('campo_animales', h.registro_id)) enlace = '#/animal/' + h.registro_id;
    } else if (h.tabla === 'campo_finanzas') {
      que = (f.tipo === 'ingreso' ? 'Ingreso' : 'Gasto') + ' · ' + (f.concepto || f.categoria || '') + ' · ' + pesos(f.monto);
      enlace = '#/dinero/' + String(f.fecha || '').slice(0, 7);
    } else {
      que = 'Potrero ' + (f.nombre || '');
      if (buscarId('campo_potreros', h.registro_id)) enlace = '#/potrero/' + h.registro_id;
    }
    var cambios = [];
    if (h.accion === 'cambio' && h.antes && h.despues) {
      var campos = CAMPOS_HIST[h.tabla] || {};
      Object.keys(campos).forEach(function (c) {
        if (String(h.antes[c] == null ? '' : h.antes[c]) !== String(h.despues[c] == null ? '' : h.despues[c])) cambios.push([campos[c], valorHist(c, h.antes[c]), valorHist(c, h.despues[c])]);
      });
    }
    return { verbo: ({ alta: 'anotó', cambio: 'cambió', borrado: 'borró' })[h.accion], que: que, cambios: cambios, enlace: enlace };
  }
  var filtroHist = { quien: '', tipo: '' };
  async function vistaHistorial() {
    var cab = '<div class="filtros"><select id="h-quien" aria-label="Persona"><option value="">Todas las personas</option></select>' +
      '<select id="h-tipo" aria-label="Qué"><option value="">Todo</option><option value="ganado">Ganado</option><option value="dinero">Dinero</option><option value="campo_potreros">Potreros</option></select></div>';
    marco('Historial', cab + '<div id="h-cuerpo"><div class="esqueleto"></div><div class="esqueleto"></div></div>', { atras: '#/mas', activa: 'mas', sub: 'Quién anotó, cambió o borró qué' });
    var cuerpo = document.getElementById('h-cuerpo');
    if (!navigator.onLine) { cuerpo.innerHTML = '<div class="vacio"><b>Sin señal</b>El historial se consulta en el servidor. Ábralo cuando tenga señal.</div>'; return; }
    var r = await sb.from('campo_historial').select('*').eq('rancho_id', S.rancho.id).order('cuando', { ascending: false }).limit(400);
    if (location.hash !== '#/historial') return;
    if (r.error) { cuerpo.innerHTML = '<div class="vacio"><b>No se pudo cargar</b>' + ((r.error.code === '42P01' || r.error.code === 'PGRST205') ? 'Falta activar el historial en el servidor.' : 'Intente de nuevo en un momento.') + '</div>'; return; }
    // El peso o potrero de un animal cambia junto con su pesaje o movimiento: no se repite.
    var conEvento = {};
    r.data.forEach(function (h) { if (h.tabla === 'campo_eventos' && h.despues) conEvento[h.despues.animal_id + '|' + h.usuario_id + '|' + h.cuando.slice(0, 15)] = 1; });
    var lista = r.data.filter(function (h) {
      if (h.tabla !== 'campo_animales' || h.accion !== 'cambio' || !h.antes || !h.despues) return true;
      var otros = Object.keys(CAMPOS_HIST.campo_animales).filter(function (c) { return c !== 'peso' && c !== 'potrero_id' && String(h.antes[c]) !== String(h.despues[c]); });
      return otros.length || !conEvento[h.registro_id + '|' + h.usuario_id + '|' + h.cuando.slice(0, 15)];
    });
    var personas = {}; lista.forEach(function (h) { personas[h.quien || 'Sistema'] = 1; });
    var selQ = document.getElementById('h-quien'), selT = document.getElementById('h-tipo');
    selQ.innerHTML += Object.keys(personas).sort().map(function (p) { return '<option' + (filtroHist.quien === p ? ' selected' : '') + '>' + e(p) + '</option>'; }).join('');
    selT.value = filtroHist.tipo;
    var pintar = function () {
      var l = lista.filter(function (h) {
        if (filtroHist.quien && (h.quien || 'Sistema') !== filtroHist.quien) return false;
        if (filtroHist.tipo === 'ganado') return h.tabla === 'campo_animales' || h.tabla === 'campo_eventos';
        if (filtroHist.tipo === 'dinero') return h.tabla === 'campo_finanzas';
        return !filtroHist.tipo || h.tabla === filtroHist.tipo;
      });
      selQ.classList.toggle('activo', !!filtroHist.quien); selT.classList.toggle('activo', !!filtroHist.tipo);
      if (!l.length) { cuerpo.innerHTML = '<div class="vacio"><b>Sin movimientos</b>' + (lista.length ? 'Pruebe con otro filtro.' : 'Aquí aparecerá cada registro que se anote, cambie o borre.') + '</div>'; return; }
      var dia = '', html = '<ul class="historial">';
      l.forEach(function (h) {
        var d = new Date(h.cuando), clave = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
        if (clave !== dia) { dia = clave; html += '<li class="hist-dia"><span>' + (clave === hoy() ? 'Hoy' : fecha(clave)) + '</span></li>'; }
        var x = describirHist(h), quien = h.quien || 'Sistema';
        var cuerpoH = '<span class="avatar chico hist-' + h.accion + '">' + e(iniciales(quien)) + '</span><span class="hist-txt"><span class="hist-arriba"><b>' + e(quien) + '</b> ' + x.verbo +
          '<time>' + d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' }) + '</time></span><span class="hist-que">' + e(x.que) + '</span>' +
          (x.cambios.length ? '<span class="hist-cambios">' + x.cambios.map(function (c) { return e(c[0]) + ': <s>' + e(c[1]) + '</s> → <b>' + e(c[2]) + '</b>'; }).join('<br>') + '</span>' : '') + '</span>';
        html += '<li>' + (x.enlace && h.accion !== 'borrado' ? '<a class="hist-fila" href="' + x.enlace + '">' + cuerpoH + '</a>' : '<div class="hist-fila">' + cuerpoH + '</div>') + '</li>';
      });
      cuerpo.innerHTML = html + '</ul>' + (r.data.length >= 400 ? '<p class="nota-edo legal">Se muestran los últimos 400 movimientos.</p>' : '');
    };
    selQ.onchange = function () { filtroHist.quien = this.value; pintar(); };
    selT.onchange = function () { filtroHist.tipo = this.value; pintar(); };
    pintar();
  }

  function vistaPotreros() {
    var act = activos();
    var l = tabla('campo_potreros').slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es', { numeric: true }); });
    var sin = act.filter(function (a) { return !a.potrero_id; }).length;
    var cuerpo = '<ul class="lista">' + (l.length ? l.map(function (p) {
      var n = act.filter(function (a) { return a.potrero_id === p.id; }).length, ag = AGUA[p.agua];
      return '<li><a class="fila" href="#/potrero/' + p.id + '"><span class="avatar' + (p.agua === 'sin_agua' ? ' alerta' : '') + '">' + ico(p.agua === 'con_agua' ? 'potrero' : 'agua') + '</span>' +
        '<span class="fila-cuerpo"><span class="fila-arriba"><b>' + e(p.nombre) + '</b>' + (p.hectareas ? '<time>' + (+p.hectareas).toLocaleString('es-MX') + ' ha</time>' : '') + '</span>' +
        '<span class="fila-abajo"><span class="fila-sub">' + (n ? n + ' animales' : 'Sin ganado') + '</span><span class="etiqueta ' + ag[1] + '">' + ag[0] + '</span></span></span></a></li>';
    }).join('') : '<li class="vacio"><b>Sin potreros</b>Agregue sus potreros para saber dónde anda cada animal.</li>') + '</ul>' +
      (sin ? '<p class="conteo">' + sin + ' animales sin potrero asignado.</p>' : '') +
      '<div class="relleno" style="margin-top:16px"><button class="btn ancho sec" id="b-pot">' + ico('mas') + 'Agregar potrero</button></div>';
    marco('Potreros · ' + l.length, cuerpo, { activa: 'potreros' });
    document.getElementById('b-pot').onclick = function () { formPotrero(); };
  }
  function vistaPotrero(id) {
    var p = buscarId('campo_potreros', id);
    if (!p) { location.hash = '#/potreros'; return; }
    var l = activos().filter(function (a) { return a.potrero_id === id; }).sort(ordenArete);
    var cuerpo =
      '<div class="cifras"><div class="cifra"><small>Animales</small><b>' + l.length + '</b><span>' + l.filter(function (a) { return a.sexo === 'hembra'; }).length + ' hembras</span></div>' +
      '<div class="cifra"><small>Agua</small><b style="font-size:20px">' + AGUA[p.agua][0] + '</b><span>' + (p.hectareas ? (+p.hectareas).toLocaleString('es-MX') + ' ha' : '') + '</span></div></div>' +
      '<section class="seccion"><div class="botonera" style="grid-template-columns:repeat(3,1fr)">' +
      '<button class="boton-accion" data-acc="agua">' + ico('agua') + 'Agua</button>' +
      '<button class="boton-accion" data-acc="mover"' + (l.length ? '' : ' disabled') + '>' + ico('mover') + 'Mover lote</button>' +
      '<button class="boton-accion" data-acc="tratar"' + (l.length ? '' : ' disabled') + '>' + ico('jeringa') + 'Vacunar lote</button></div></section>' +
      (p.notas ? '<p class="conteo" style="margin-top:12px">' + e(p.notas) + '</p>' : '') +
      '<section class="seccion"><div class="seccion-titulo"><h2>Ganado aquí</h2></div><div class="panel"><ul class="lista">' + (l.length ? l.map(filaAnimal).join('') : '<li class="vacio">Sin ganado en este potrero.</li>') + '</ul></div></section>';
    marco(p.nombre, cuerpo, { atras: '#/potreros', activa: 'potreros', sub: 'Potrero', derecha: '<button class="btn-icono" id="b-editar" aria-label="Editar potrero">' + ico('editar') + '</button>' });
    document.getElementById('b-editar').onclick = function () { formPotrero(p); };
    app.querySelector('[data-acc=agua]').onclick = function () { formAgua(p); };
    app.querySelector('[data-acc=mover]').onclick = function () { formLote('mover', p.id); };
    app.querySelector('[data-acc=tratar]').onclick = function () { formLote('tratar', p.id); };
  }

  var busqueda = '';
  function vistaBuscar() {
    var cuerpo =
      '<div class="buscador grande">' + ico('buscar') + '<input id="b-q" type="search" inputmode="search" enterkeyhint="search" placeholder="Arete, nombre, potrero, proveedor, producto…" value="' + e(busqueda) + '" aria-label="Buscar en todo el rancho" autocomplete="off"></div>' +
      '<div id="b-res"></div>';
    marco('Buscar', cuerpo, { activa: 'buscar', atras: '#/inicio' });
    var q = document.getElementById('b-q'), res = document.getElementById('b-res'), abiertos = {};
    var grupoHtml = function (id, titulo, items, fila) {
      if (!items.length) return '';
      var ver = abiertos[id] ? items : items.slice(0, 6);
      return '<section class="seccion"><div class="seccion-titulo"><h2>' + titulo + ' · ' + items.length + '</h2>' + (items.length > 6 ? '<button data-mas="' + id + '">' + (abiertos[id] ? 'Ver menos' : 'Ver todos') + '</button>' : '') + '</div>' +
        '<div class="panel"><ul class="lista">' + ver.map(fila).join('') + '</ul></div></section>';
    };
    var pintar = function () {
      busqueda = q.value;
      var terminos = sinAcentos(q.value).trim().split(/\s+/).filter(Boolean);
      if (!terminos.length) {
        res.innerHTML = '<div class="vacio"><b>Busque en todo el rancho</b>Aretes, nombres, razas, colores, potreros, proveedores, productos, compradores o montos.</div>' +
          '<div class="chips sugerencias">' + ['Vacas', 'Preñada', 'Vacía', 'Clostridial', 'Combustible', 'Sin agua'].map(function (s) { return '<button class="chip" data-sug="' + s + '">' + s + '</button>'; }).join('') + '</div>';
        res.querySelectorAll('[data-sug]').forEach(function (b) { b.onclick = function () { q.value = b.dataset.sug; pintar(); }; });
        return;
      }
      var coincide = function (texto) { var t = sinAcentos(texto); return terminos.every(function (w) { return t.indexOf(w) > -1; }); };
      var aretes = tabla('campo_animales').filter(function (a) {
        return coincide([a.arete, a.nombre, NOMBRE_CAT[a.categoria], NOMBRE_CAT[a.categoria] + 's', a.raza, a.color, a.sexo, nombrePotrero(a.potrero_id), a.estado, a.notas].join(' '));
      }).sort(function (a, b) { var k = normArete(q.value); return (normArete(b.arete) === k) - (normArete(a.arete) === k) || ordenArete(a, b); });
      var potreros = tabla('campo_potreros').filter(function (p) { return coincide([p.nombre, p.notas, AGUA[p.agua][0], 'potrero'].join(' ')); });
      var dinero = puedeDinero() ? tabla('campo_finanzas').filter(function (f) {
        return coincide([f.concepto, f.proveedor, f.categoria, f.tipo, Math.round(f.monto), pesos(f.monto), fecha(f.fecha)].join(' '));
      }).sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }) : [];
      var registros = tabla('campo_eventos').filter(function (x) {
        if (x.tipo === 'alta') return false;
        var a = buscarId('campo_animales', x.animal_id);
        return coincide([EVENTOS[x.tipo] ? EVENTOS[x.tipo][0] : '', x.detalle, x.peso ? x.peso + ' kg' : '', fecha(x.fecha), a ? 'arete ' + a.arete : ''].join(' '));
      }).sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
      var total = aretes.length + potreros.length + dinero.length + registros.length;
      res.innerHTML = (total ? '<p class="conteo">' + total + ' resultados</p>' : '<div class="vacio"><b>Sin resultados</b>Pruebe con otra palabra.</div>') +
        grupoHtml('g', 'Ganado', aretes, filaAnimal) +
        grupoHtml('p', 'Potreros', potreros, function (p) {
          var n = activos().filter(function (a) { return a.potrero_id === p.id; }).length, ag = AGUA[p.agua];
          return '<li><a class="fila" href="#/potrero/' + p.id + '"><span class="avatar">' + ico('potrero') + '</span><span class="fila-cuerpo"><span class="fila-titulo">' + e(p.nombre) + '</span><span class="fila-sub">' + (n ? n + ' animales' : 'Sin ganado') + '</span></span><span class="etiqueta ' + ag[1] + '">' + ag[0] + '</span></a></li>';
        }) +
        grupoHtml('d', 'Dinero', dinero, function (f) {
          return '<li><button class="fila" data-fin="' + f.id + '"><span class="avatar ' + f.tipo + '">' + ico(f.ticket_path ? 'foto' : f.tipo) + '</span><span class="fila-cuerpo"><span class="fila-titulo">' + e(f.concepto || f.categoria) + '</span><span class="fila-sub">' + e(f.categoria) + (f.proveedor ? ' · ' + e(f.proveedor) : '') + '</span></span>' +
            '<span class="fila-der"><b class="num" style="color:' + (f.tipo === 'gasto' ? 'var(--gasto)' : 'var(--ingreso)') + '">' + (f.tipo === 'gasto' ? '−' : '+') + pesos(f.monto) + '</b><small>' + fecha(f.fecha, true) + '</small></span></button></li>';
        }) +
        grupoHtml('r', 'Registros', registros, function (x) {
          var a = buscarId('campo_animales', x.animal_id), ev = EVENTOS[x.tipo] || EVENTOS.nota;
          return '<li><a class="fila" href="#/animal/' + x.animal_id + '"><span class="avatar">' + ico(ev[1]) + '</span><span class="fila-cuerpo"><span class="fila-titulo">' + e(ev[0]) + ' · arete ' + e(a ? a.arete : '—') + '</span><span class="fila-sub">' + e(x.detalle || (x.peso ? kg(x.peso) : '')) + '</span></span><span class="fila-der"><small>' + fecha(x.fecha, true) + '</small></span></a></li>';
        });
      res.querySelectorAll('[data-mas]').forEach(function (b) { b.onclick = function () { abiertos[b.dataset.mas] = !abiertos[b.dataset.mas]; pintar(); }; });
      res.querySelectorAll('[data-fin]').forEach(function (b) { b.onclick = function () { formDinero(buscarId('campo_finanzas', b.dataset.fin)); }; });
    };
    var espera;
    q.oninput = function () { clearTimeout(espera); espera = setTimeout(pintar, 120); };
    pintar();
    q.focus();
  }

  function vistaMas() {
    var item = function (id, ic, t, s) { return '<li><button class="fila" id="' + id + '"><span class="avatar">' + ico(ic) + '</span><span class="fila-cuerpo"><span class="fila-titulo">' + t + '</span>' + (s ? '<span class="fila-sub">' + s + '</span>' : '') + '</span><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></button></li>'; };
    var roles = { dueno: 'Dueño', encargado: 'Encargado', vaquero: 'Vaquero' };
    var cuerpo =
      (S.rechazados.length ? '<div class="panel"><ul class="lista">' + item('m-rech', 'alerta', S.rechazados.length + (S.rechazados.length === 1 ? ' cambio por revisar' : ' cambios por revisar'), 'No se guardaron en el servidor · toque para revisar') + '</ul></div>' : '') +
      (instalada() ? '' : '<div class="panel"><ul class="lista">' + item('m-inst', 'descargar', 'Instalar en el celular', 'Ícono en su pantalla y funciona sin señal') + '</ul></div>') +
      '<div class="panel"><ul class="lista">' + item('m-pot', 'potrero', 'Potreros', tabla('campo_potreros').length + ' registrados') +
      (puedeDinero() ? item('m-edos', 'reporte', 'Estados financieros', 'Resultados, valor del hato y flujo') : '') +
      (puedeDinero() ? item('m-hist', 'historial', 'Historial de cambios', 'Quién anotó, cambió o borró qué') : '') +
      item('m-csv-g', 'descargar', 'Descargar ganado', 'Archivo para Excel') +
      (puedeDinero() ? item('m-csv-d', 'descargar', 'Descargar dinero', 'Archivo para Excel') : '') +
      item('m-sync', 'sync', 'Actualizar datos', S.cola.length ? S.cola.length + ' cambios por subir' : 'Todo está guardado') + '</ul></div>' +
      (S.ranchos.length > 1 ? '<section class="seccion"><div class="seccion-titulo"><h2>Ranchos</h2></div><div class="panel"><ul class="lista">' + S.ranchos.map(function (r) {
        return '<li><button class="fila" data-rancho="' + r.rancho_id + '"><span class="avatar">' + ico('inicio') + '</span><span class="fila-cuerpo"><span class="fila-titulo">' + e(r.campo_ranchos.nombre) + '</span></span>' + (r.rancho_id === S.rancho.id ? '<span class="etiqueta azul">Actual</span>' : '') + '</button></li>';
      }).join('') + '</ul></div></section>' : '') +
      '<section class="seccion"><div class="seccion-titulo"><h2>Cuenta</h2></div><div class="panel"><ul class="lista">' +
      '<li><div class="fila"><span class="avatar">' + ico('usuario') + '</span><span class="fila-cuerpo"><span class="fila-titulo">' + e(S.miembro || '') + '</span><span class="fila-sub">' + roles[S.rol] + ' · ' + e(S.rancho.nombre) + '</span></span></div></li>' +
      item('m-salir', 'salir', 'Cerrar sesión', '') + '</ul></div></section>' +
      '<p class="pie-app">Rancho Vivo ' + VERSION + ' · Hecho por VYNTRA, Chihuahua<br>Soporte: WhatsApp 614 272 6674</p>';
    marco('Más', cuerpo, { activa: 'mas' });
    document.getElementById('m-pot').onclick = function () { location.hash = '#/potreros'; };
    if (!instalada()) document.getElementById('m-inst').onclick = function () { ofrecerInstalar(true); };
    if (S.rechazados.length) document.getElementById('m-rech').onclick = formRechazados;
    document.getElementById('m-csv-g').onclick = csvGanado;
    if (puedeDinero()) document.getElementById('m-csv-d').onclick = csvDinero;
    if (puedeDinero()) document.getElementById('m-edos').onclick = function () { location.hash = '#/estados/' + hoy().slice(0, 4); };
    if (puedeDinero()) document.getElementById('m-hist').onclick = function () { location.hash = '#/historial'; };
    document.getElementById('m-sync').onclick = async function () {
      if (!navigator.onLine) return aviso('Sin señal. Se subirá solo cuando vuelva.', true);
      await subir(); var ok = await cargar(true); aviso(ok ? 'Datos al día.' : 'No se pudo actualizar. Intente de nuevo.', !ok); ruta();
    };
    document.getElementById('m-salir').onclick = salir;
    app.querySelectorAll('[data-rancho]').forEach(function (b) {
      b.onclick = function () { var r = S.ranchos.filter(function (x) { return x.rancho_id === b.getAttribute('data-rancho'); })[0]; abrirRancho({ usuario: S.usuario.id, rancho: r.campo_ranchos, rol: r.rol, nombre: r.nombre }, !navigator.onLine); location.hash = '#/inicio'; };
    });
  }

  /* ---------- Hojas de formulario ---------- */
  function abrirHoja(titulo, cuerpo, pie, alListo) {
    hoja.innerHTML = '<div class="hoja-cab"><h2 id="hoja-titulo">' + e(titulo) + '</h2><button class="btn-icono" type="button" data-cerrar aria-label="Cerrar">' + ico('cerrar') + '</button></div>' +
      '<form class="hoja-forma" novalidate style="display:contents"><div class="hoja-cuerpo">' + cuerpo + '</div>' + (pie ? '<div class="hoja-pie">' + pie + '</div>' : '') + '</form>';
    hoja.querySelector('[data-cerrar]').onclick = function () { hoja.close(); };
    hoja.querySelectorAll('.segmento, .opciones').forEach(function (g) {
      g.querySelectorAll('button').forEach(function (b) {
        b.type = 'button';
        b.onclick = function () { g.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); g.dataset.valor = b.dataset.v; if (g.onelegir) g.onelegir(b.dataset.v); };
      });
    });
    if (!hoja.open) hoja.showModal();
    var f = hoja.querySelector('form');
    if (alListo) alListo(f);
    var primero = hoja.querySelector('input:not([type=hidden]), select, textarea');
    if (primero && window.matchMedia('(min-width: 640px)').matches) primero.focus();
  }
  hoja.addEventListener('click', function (ev) { if (ev.target === hoja) hoja.close(); });
  hoja.addEventListener('input', function (ev) {
    var c = ev.target.closest && ev.target.closest('.campo.error');
    if (c) { c.classList.remove('error'); var m = c.querySelector('.msg-error'); if (m) m.remove(); }
  });
  function v(id) { var el = hoja.querySelector('#' + id); return el ? el.value.trim() : ''; }
  function grupo(id) { var g = hoja.querySelector('#' + id); return g ? g.dataset.valor || '' : ''; }
  function marcarError(id, msg) {
    var el = hoja.querySelector('#' + id), c = el && el.closest('.campo');
    if (!c) return aviso(msg, true);
    c.classList.add('error');
    var m = c.querySelector('.msg-error') || c.appendChild(document.createElement('p'));
    m.className = 'msg-error'; m.textContent = msg; el.focus && el.focus();
  }
  function limpiarErrores() { hoja.querySelectorAll('.campo.error').forEach(function (c) { c.classList.remove('error'); var m = c.querySelector('.msg-error'); if (m) m.remove(); }); }
  function campo(id, rot, html, ayuda) { return '<div class="campo"><label for="' + id + '">' + rot + '</label>' + html + (ayuda ? '<p class="ayuda">' + ayuda + '</p>' : '') + '</div>'; }
  function entrada(id, tipo, val, extra) { return '<input id="' + id + '" type="' + tipo + '" value="' + e(val == null ? '' : val) + '"' + (extra || '') + '>'; }
  function seg(id, ops, val) { return '<div class="segmento" id="' + id + '" data-valor="' + e(val || '') + '">' + ops.map(function (o) { return '<button data-v="' + o[0] + '" aria-pressed="' + (o[0] === val) + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
  function opcionesPotrero(sel, vacio) {
    return (vacio ? '<option value="">' + vacio + '</option>' : '') + tabla('campo_potreros').slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es', { numeric: true }); })
      .map(function (p) { return '<option value="' + p.id + '"' + (p.id === sel ? ' selected' : '') + '>' + e(p.nombre) + '</option>'; }).join('');
  }
  function evento(a, tipo, datos) { return guardar('campo_eventos', Object.assign({ animal_id: a.id, tipo: tipo, fecha: hoy() }, datos)); }
  function listo(msg) { hoja.close(); aviso(msg); ruta(); subir(); }
  function areteLibre(arete, id) {
    var k = arete.toLowerCase();
    return !tabla('campo_animales').some(function (x) { return x.arete.toLowerCase() === k && x.id !== id; });
  }

  /* Registro de eventos: los usan los formularios y el dictado por voz */
  function regPesaje(a, peso, fe) {
    evento(a, 'pesaje', { peso: peso, fecha: fe });
    var ult = eventosDe(a.id).filter(function (x) { return x.peso && x.tipo !== 'venta'; })[0];
    guardar('campo_animales', { id: a.id, peso: ult ? ult.peso : peso });
  }
  function regTratamiento(a, tipo, prod, fe, costo) {
    evento(a, tipo, { detalle: prod, fecha: fe, monto: costo || null });
    if (costo > 0 && puedeDinero()) guardar('campo_finanzas', { tipo: 'gasto', categoria: 'Medicinas y vacunas', concepto: prod + ' · arete ' + a.arete, monto: costo, fecha: fe, animal_id: a.id });
  }
  function regParto(a, d) {
    var arete = d.arete || ('S/A-' + a.arete + '-' + d.fecha.replace(/-/g, '').slice(2));
    var cria = guardar('campo_animales', { arete: arete, sexo: d.sexo, categoria: d.sexo === 'hembra' ? 'becerra' : 'becerro', nacimiento: d.fecha, peso: d.peso, madre_id: a.id, potrero_id: a.potrero_id, estado: 'activo', raza: a.raza || null });
    evento(cria, 'alta', { fecha: d.fecha, peso: d.peso, detalle: 'Nació de arete ' + a.arete });
    evento(a, 'parto', { fecha: d.fecha, detalle: (d.sexo === 'hembra' ? 'Becerra ' : 'Becerro ') + arete + (d.nota ? '. ' + d.nota : '') });
    if (a.categoria === 'vaquilla') guardar('campo_animales', { id: a.id, categoria: 'vaca' });
    return arete;
  }
  function regPrenez(a, r, meses, fe) { evento(a, 'prenez', { fecha: fe, detalle: r + (r === 'Preñada' && meses ? ', ' + meses + ' meses' : '') }); }
  function regMover(a, potreroId, fe) {
    var antes = nombrePotrero(a.potrero_id);
    guardar('campo_animales', { id: a.id, potrero_id: potreroId });
    evento(a, 'movimiento', { fecha: fe, detalle: 'De ' + antes + ' a ' + nombrePotrero(potreroId) });
  }
  function regVenta(a, d) {
    guardar('campo_animales', { id: a.id, estado: 'vendido', potrero_id: null });
    evento(a, 'venta', { fecha: d.fecha, monto: d.precio, peso: d.peso, detalle: d.comprador ? 'A ' + d.comprador : null });
    if (puedeDinero()) guardar('campo_finanzas', { tipo: 'ingreso', categoria: 'Venta de ganado', concepto: 'Venta arete ' + a.arete + (d.peso ? ' · ' + kg(d.peso) : ''), monto: d.precio, fecha: d.fecha, proveedor: d.comprador || null, animal_id: a.id });
  }
  function regDestete(a, peso, fe) {
    evento(a, 'destete', { peso: peso, fecha: fe });
    guardar('campo_animales', { id: a.id, peso: peso });
  }
  function regCompra(a, precio, proveedor, fe) {
    evento(a, 'compra', { fecha: fe, monto: precio, detalle: proveedor ? 'A ' + proveedor : null });
    if (puedeDinero()) guardar('campo_finanzas', { tipo: 'gasto', categoria: 'Compra de ganado', concepto: 'Compra arete ' + a.arete, monto: precio, fecha: fe, proveedor: proveedor || null, animal_id: a.id });
  }
  function regBaja(a, causa, fe) {
    guardar('campo_animales', { id: a.id, estado: 'muerto', potrero_id: null });
    evento(a, 'muerte', { fecha: fe, detalle: causa || null });
  }

  function menuRegistrar() {
    var op = function (k, ic, t, s) { return '<li><button type="button" data-k="' + k + '"><span class="avatar">' + ico(ic) + '</span><span>' + t + '<small>' + s + '</small></span></button></li>'; };
    abrirHoja('Registrar', '<ul class="menu-hoja">' +
      op('voz', 'mic', 'Dictar al ganado', 'Partos, pesajes, vacunas, cambios de potrero…') +
      op('animal', 'ganado', 'Animal nuevo', 'Alta con arete, sexo y potrero') +
      op('pesar', 'bascula', 'Pesaje', 'Peso de un animal') +
      op('tratar', 'jeringa', 'Vacuna o tratamiento', 'A un animal o a todo un potrero') +
      op('lote', 'mover', 'Mover ganado', 'Todo un potrero a otro') +
      (puedeDinero() ? op('ticket', 'foto', 'Foto de ticket', 'Se lee solo: monto, fecha y proveedor') + op('dictar', 'mic', 'Dictar gasto', 'Dígalo con su voz') +
        op('gasto', 'gasto', 'Gasto a mano', 'Alimento, medicina, sueldos…') + op('ingreso', 'ingreso', 'Ingreso', 'Venta de ganado, apoyos…') : '') + '</ul>', '');
    hoja.querySelectorAll('[data-k]').forEach(function (b) {
      b.onclick = function () {
        var k = b.dataset.k;
        if (k === 'animal') formAnimal(); else if (k === 'pesar') elegirAnimal('Pesar animal', formPesaje);
        else if (k === 'tratar') formLote('tratar'); else if (k === 'lote') formLote('mover');
        else if (k === 'ticket') capturarTicket(); else if (k === 'dictar') dictar(); else if (k === 'voz') dictarGanado();
        else formDinero(null, k);
      };
    });
  }
  function elegirAnimal(titulo, siguiente) {
    abrirHoja(titulo, '<div class="buscador">' + ico('buscar') + '<input id="ea-q" type="search" placeholder="Número de arete" autocomplete="off" aria-label="Número de arete"></div><ul class="lista" id="ea-l"></ul>', '');
    var q = hoja.querySelector('#ea-q'), ul = hoja.querySelector('#ea-l');
    var pintar = function () {
      var t = q.value.trim().toLowerCase();
      var l = activos().filter(function (a) { return !t || a.arete.toLowerCase().indexOf(t) > -1 || (a.nombre || '').toLowerCase().indexOf(t) > -1; }).sort(ordenArete).slice(0, 40);
      ul.innerHTML = l.length ? l.map(function (a) { return '<li><button type="button" class="fila" data-id="' + a.id + '"><span class="avatar ' + (a.sexo === 'hembra' ? 'h' : 'm') + '">' + (a.sexo === 'hembra' ? 'H' : 'M') + '</span><span class="fila-cuerpo"><span class="fila-titulo"><span class="arete">' + e(a.arete) + '</span></span><span class="fila-sub">' + NOMBRE_CAT[a.categoria] + ' · ' + e(nombrePotrero(a.potrero_id)) + '</span></span><span class="fila-der">' + (a.peso ? '<b>' + kg(a.peso) + '</b>' : '') + '</span></button></li>'; }).join('')
        : '<li class="vacio">No hay animales con ese arete.</li>';
      ul.querySelectorAll('[data-id]').forEach(function (b) { b.onclick = function () { siguiente(buscarId('campo_animales', b.dataset.id)); }; });
    };
    q.oninput = pintar; pintar(); q.focus();
  }

  function formAnimal(a) {
    var nuevo = !a; a = a || { sexo: 'hembra', categoria: 'vaca', estado: 'activo' };
    var opCat = function (sexo, sel) { return CATEGORIAS[sexo].map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === sel ? ' selected' : '') + '>' + c[1] + '</option>'; }).join(''); };
    var hembras = tabla('campo_animales').filter(function (x) { return x.sexo === 'hembra' && x.id !== a.id && x.categoria !== 'becerra'; }).sort(ordenArete);
    abrirHoja(nuevo ? 'Animal nuevo' : 'Editar arete ' + a.arete,
      campo('fa-arete', 'Número de arete', entrada('fa-arete', 'text', a.arete, ' autocomplete="off" maxlength="30" required')) +
      '<div class="campo"><span class="rotulo">Sexo</span>' + seg('fa-sexo', [['hembra', 'Hembra'], ['macho', 'Macho']], a.sexo) + '</div>' +
      '<div class="dos-campos">' + campo('fa-cat', 'Tipo', '<select id="fa-cat">' + opCat(a.sexo, a.categoria) + '</select>') +
      campo('fa-peso', 'Peso (kg)', entrada('fa-peso', 'number', a.peso, ' inputmode="decimal" min="0" step="any"')) + '</div>' +
      '<div class="dos-campos">' + campo('fa-raza', 'Raza', entrada('fa-raza', 'text', a.raza, ' list="razas" maxlength="40"') + '<datalist id="razas"><option>Angus</option><option>Brangus</option><option>Beefmaster</option><option>Charolais</option><option>Hereford</option><option>Simmental</option><option>Brahman</option><option>Cruza</option></datalist>') +
      campo('fa-color', 'Color', entrada('fa-color', 'text', a.color, ' list="colores" maxlength="40"') + '<datalist id="colores"><option>Negro</option><option>Colorado</option><option>Cara blanca</option><option>Blanco</option><option>Bayo</option><option>Pinto</option><option>Gris</option></datalist>') + '</div>' +
      '<div class="dos-campos">' + campo('fa-nac', 'Nacimiento', entrada('fa-nac', 'date', a.nacimiento, ' max="' + hoy() + '"')) +
      campo('fa-pot', 'Potrero', '<select id="fa-pot">' + opcionesPotrero(a.potrero_id, 'Sin potrero') + '</select>') + '</div>' +
      campo('fa-madre', 'Madre', '<select id="fa-madre"><option value="">No registrada</option>' + hembras.map(function (h) { return '<option value="' + h.id + '"' + (h.id === a.madre_id ? ' selected' : '') + '>' + e(h.arete) + (h.nombre ? ' · ' + e(h.nombre) : '') + '</option>'; }).join('') + '</select>') +
      campo('fa-nombre', 'Nombre o seña (opcional)', entrada('fa-nombre', 'text', a.nombre, ' maxlength="40"')) +
      campo('fa-notas', 'Notas', '<textarea id="fa-notas" maxlength="500">' + e(a.notas || '') + '</textarea>') +
      (nuevo ? '<div class="campo"><span class="rotulo">Origen</span>' + seg('fa-origen', [['nacio', 'Nació aquí'], ['compra', 'Comprado']], 'nacio') + '</div>' +
        '<div class="dos-campos" id="fa-compra" hidden>' + campo('fa-precio', 'Precio de compra', entrada('fa-precio', 'number', '', ' inputmode="decimal" min="0" step="any"')) +
        campo('fa-prov', 'A quién se compró', entrada('fa-prov', 'text', '', ' maxlength="80"')) + '</div>' : '') +
      (!nuevo && puedeBorrar() ? '<button type="button" class="btn peligro ancho" id="fa-borrar">' + ico('borrar') + 'Borrar este animal</button>' : ''),
      '<button type="button" class="btn sec" data-cerrar2>Cancelar</button><button type="submit" class="btn">Guardar</button>',
      function (f) {
        hoja.querySelector('[data-cerrar2]').onclick = function () { hoja.close(); };
        var segSexo = hoja.querySelector('#fa-sexo');
        segSexo.onelegir = function (s) { hoja.querySelector('#fa-cat').innerHTML = opCat(s, s === 'hembra' ? 'vaca' : 'toro'); };
        var segOrigen = hoja.querySelector('#fa-origen');
        if (segOrigen) segOrigen.onelegir = function (o) { hoja.querySelector('#fa-compra').hidden = o !== 'compra'; };
        var bb = hoja.querySelector('#fa-borrar');
        if (bb) bb.onclick = function () {
          if (!bb.dataset.ok) { bb.dataset.ok = '1'; bb.insertAdjacentHTML('beforebegin', '<p class="confirmar">Se borrará el animal con todo su historial. Esto no se puede deshacer. Si lo vendió o murió, mejor use “Vender” o “Baja”. Toque otra vez para borrar.</p>'); return; }
          borrar('campo_animales', a.id); hoja.close(); aviso('Animal borrado.'); location.hash = '#/ganado'; subir();
        };
        f.onsubmit = function (ev) {
          ev.preventDefault(); limpiarErrores();
          var arete = v('fa-arete'), peso = v('fa-peso') === '' ? null : num(v('fa-peso'));
          if (!arete) return marcarError('fa-arete', 'Escriba el número de arete.');
          if (!areteLibre(arete, a.id)) return marcarError('fa-arete', 'Ya hay un animal con ese arete.');
          if (peso !== null && !(peso > 0 && peso < 2000)) return marcarError('fa-peso', 'Revise el peso.');
          var comprado = nuevo && grupo('fa-origen') === 'compra', precio = num(v('fa-precio'));
          if (comprado && !(precio > 0)) return marcarError('fa-precio', 'Escriba el precio de compra.');
          var fila = { id: a.id, arete: arete, sexo: grupo('fa-sexo') || 'hembra', categoria: v('fa-cat'), peso: peso, raza: v('fa-raza') || null, color: v('fa-color') || null,
            nacimiento: v('fa-nac') || null, potrero_id: v('fa-pot') || null, madre_id: v('fa-madre') || null, nombre: v('fa-nombre') || null, notas: v('fa-notas') || null, estado: a.estado || 'activo' };
          var g = guardar('campo_animales', fila);
          if (nuevo) evento(g, 'alta', { peso: peso, detalle: fila.potrero_id ? 'En ' + nombrePotrero(fila.potrero_id) : null });
          if (comprado) regCompra(g, precio, v('fa-prov'), hoy());
          else if (a.potrero_id !== fila.potrero_id) evento(g, 'movimiento', { detalle: 'A ' + nombrePotrero(fila.potrero_id) });
          listo(nuevo ? 'Arete ' + arete + ' registrado.' : 'Cambios guardados.');
          if (nuevo) location.hash = '#/animal/' + g.id;
        };
      });
  }

  function formPesaje(a) {
    abrirHoja('Pesar arete ' + a.arete,
      campo('fp-peso', 'Peso (kg)', entrada('fp-peso', 'number', '', ' inputmode="decimal" min="0" step="any" required'), a.peso ? 'Último peso: ' + kg(a.peso) : '') +
      campo('fp-fecha', 'Fecha', entrada('fp-fecha', 'date', hoy(), ' max="' + hoy() + '"')),
      '<button type="submit" class="btn ancho">Guardar peso</button>',
      function (f) {
        f.onsubmit = function (ev) {
          ev.preventDefault(); limpiarErrores();
          var p = num(v('fp-peso'));
          if (!(p > 0 && p < 2000)) return marcarError('fp-peso', 'Escriba un peso válido.');
          regPesaje(a, p, v('fp-fecha') || hoy());
          listo('Peso guardado: ' + kg(p));
        };
      });
  }
  function formTratamiento(a) {
    abrirHoja('Vacuna o tratamiento',
      '<p class="conteo">Arete ' + e(a.arete) + '</p>' +
      '<div class="campo"><span class="rotulo">Tipo</span>' + seg('ft-tipo', [['vacuna', 'Vacuna'], ['tratamiento', 'Tratamiento']], 'vacuna') + '</div>' +
      campo('ft-prod', 'Producto o motivo', entrada('ft-prod', 'text', '', ' maxlength="80" required placeholder="Ej. Clostridial 8 vías"')) +
      campo('ft-fecha', 'Fecha', entrada('ft-fecha', 'date', hoy(), ' max="' + hoy() + '"')) +
      (puedeDinero() ? campo('ft-costo', 'Costo (opcional)', entrada('ft-costo', 'number', '', ' inputmode="decimal" min="0" step="any"'), 'Si lo escribe, se anota también como gasto.') : ''),
      '<button type="submit" class="btn ancho">Guardar</button>',
      function (f) {
        f.onsubmit = function (ev) {
          ev.preventDefault(); limpiarErrores();
          var prod = v('ft-prod'), costo = num(v('ft-costo'));
          if (!prod) return marcarError('ft-prod', 'Escriba el producto o el motivo.');
          regTratamiento(a, grupo('ft-tipo') || 'vacuna', prod, v('ft-fecha') || hoy(), costo);
          listo('Guardado.');
        };
      });
  }
  function formParto(a) {
    abrirHoja('Parto de arete ' + a.arete,
      campo('fpa-fecha', 'Fecha del parto', entrada('fpa-fecha', 'date', hoy(), ' max="' + hoy() + '"')) +
      '<div class="campo"><span class="rotulo">Cría</span>' + seg('fpa-sexo', [['hembra', 'Becerra'], ['macho', 'Becerro']], 'hembra') + '</div>' +
      '<div class="dos-campos">' + campo('fpa-arete', 'Arete de la cría', entrada('fpa-arete', 'text', '', ' maxlength="30" autocomplete="off"'), 'Si aún no tiene, déjelo vacío.') +
      campo('fpa-peso', 'Peso al nacer (kg)', entrada('fpa-peso', 'number', '', ' inputmode="decimal" min="0" step="any"')) + '</div>' +
      campo('fpa-nota', 'Notas', entrada('fpa-nota', 'text', '', ' maxlength="120" placeholder="Ej. Parto normal, ombligo limpio"')),
      '<button type="submit" class="btn ancho">Guardar parto</button>',
      function (f) {
        f.onsubmit = function (ev) {
          ev.preventDefault(); limpiarErrores();
          var fe = v('fpa-fecha') || hoy(), sexo = grupo('fpa-sexo') || 'hembra', peso = v('fpa-peso') === '' ? null : num(v('fpa-peso'));
          var arete = v('fpa-arete');
          if (arete && !areteLibre(arete)) return marcarError('fpa-arete', 'Ya hay un animal con ese arete.');
          if (peso !== null && !(peso > 0 && peso < 200)) return marcarError('fpa-peso', 'Revise el peso.');
          arete = regParto(a, { fecha: fe, sexo: sexo, arete: arete, peso: peso, nota: v('fpa-nota') });
          listo('Parto guardado. Cría ' + arete + ' registrada.');
        };
      });
  }
  function formPrenez(a) {
    abrirHoja('Preñez de arete ' + a.arete,
      '<div class="campo"><span class="rotulo">Resultado</span>' + seg('fpr-r', [['Preñada', 'Preñada'], ['Vacía', 'Vacía']], 'Preñada') + '</div>' +
      campo('fpr-meses', 'Meses de gestación (opcional)', entrada('fpr-meses', 'number', '', ' inputmode="numeric" min="1" max="9"')) +
      campo('fpr-fecha', 'Fecha', entrada('fpr-fecha', 'date', hoy(), ' max="' + hoy() + '"')),
      '<button type="submit" class="btn ancho">Guardar</button>',
      function (f) {
        f.onsubmit = function (ev) {
          ev.preventDefault();
          regPrenez(a, grupo('fpr-r') || 'Preñada', v('fpr-meses'), v('fpr-fecha') || hoy());
          listo('Guardado.');
        };
      });
  }
  function formMover(a) {
    abrirHoja('Mover arete ' + a.arete,
      campo('fm-pot', 'Llevar a', '<select id="fm-pot">' + opcionesPotrero(a.potrero_id) + '</select>', 'Ahora está en ' + e(nombrePotrero(a.potrero_id)) + '.') +
      campo('fm-fecha', 'Fecha', entrada('fm-fecha', 'date', hoy(), ' max="' + hoy() + '"')),
      '<button type="submit" class="btn ancho">Mover</button>',
      function (f) {
        f.onsubmit = function (ev) {
          ev.preventDefault();
          var p = v('fm-pot');
          if (!p) return aviso('Primero agregue potreros en Más → Potreros.', true);
          if (p === a.potrero_id) return marcarError('fm-pot', 'Ya está en ese potrero.');
          regMover(a, p, v('fm-fecha') || hoy());
          listo('Movido a ' + nombrePotrero(p) + '.');
        };
      });
  }
  function formNota(a) {
    abrirHoja('Nota para arete ' + a.arete,
      campo('fn-t', 'Nota', '<textarea id="fn-t" maxlength="500" required></textarea>') + campo('fn-fecha', 'Fecha', entrada('fn-fecha', 'date', hoy(), ' max="' + hoy() + '"')),
      '<button type="submit" class="btn ancho">Guardar nota</button>',
      function (f) {
        f.onsubmit = function (ev) {
          ev.preventDefault(); limpiarErrores();
          if (!v('fn-t')) return marcarError('fn-t', 'Escriba la nota.');
          evento(a, 'nota', { fecha: v('fn-fecha') || hoy(), detalle: v('fn-t') });
          listo('Nota guardada.');
        };
      });
  }
  function formVenta(a) {
    abrirHoja('Vender arete ' + a.arete,
      '<div class="dos-campos">' + campo('fv-precio', 'Precio total', '<div class="monto"><span>$</span>' + entrada('fv-precio', 'number', '', ' inputmode="decimal" min="0" step="any"') + '</div>') +
      campo('fv-peso', 'Peso de venta (kg)', entrada('fv-peso', 'number', a.peso || '', ' inputmode="decimal" min="0" step="any"')) + '</div>' +
      campo('fv-comp', 'Comprador', entrada('fv-comp', 'text', '', ' maxlength="80"')) +
      campo('fv-fecha', 'Fecha', entrada('fv-fecha', 'date', hoy(), ' max="' + hoy() + '"')),
      '<button type="submit" class="btn ancho">Registrar venta</button>',
      function (f) {
        f.onsubmit = function (ev) {
          ev.preventDefault(); limpiarErrores();
          var precio = num(v('fv-precio')), peso = v('fv-peso') === '' ? null : num(v('fv-peso')), fe = v('fv-fecha') || hoy();
          if (!(precio > 0)) return marcarError('fv-precio', 'Escriba el precio de venta.');
          regVenta(a, { precio: precio, peso: peso, comprador: v('fv-comp'), fecha: fe });
          listo('Venta registrada.');
        };
      });
  }
  function formDestete(a) {
    abrirHoja('Destete de arete ' + a.arete,
      campo('fd2-peso', 'Peso al destete (kg)', entrada('fd2-peso', 'number', '', ' inputmode="decimal" min="0" step="any" required'), a.nacimiento ? 'Edad: ' + edad(a.nacimiento) : '') +
      campo('fd2-fecha', 'Fecha', entrada('fd2-fecha', 'date', hoy(), ' max="' + hoy() + '"')),
      '<button type="submit" class="btn ancho">Guardar destete</button>',
      function (f) {
        f.onsubmit = function (ev) {
          ev.preventDefault(); limpiarErrores();
          var p = num(v('fd2-peso'));
          if (!(p > 0 && p < 800)) return marcarError('fd2-peso', 'Escriba el peso al destete.');
          regDestete(a, p, v('fd2-fecha') || hoy());
          listo('Destete guardado: ' + kg(p));
        };
      });
  }
  function formBaja(a) {
    abrirHoja('Baja de arete ' + a.arete,
      campo('fb-causa', 'Causa', entrada('fb-causa', 'text', '', ' maxlength="120" placeholder="Ej. Se atascó en el bordo"')) +
      campo('fb-fecha', 'Fecha', entrada('fb-fecha', 'date', hoy(), ' max="' + hoy() + '"')),
      '<button type="submit" class="btn peligro ancho">Registrar baja</button>',
      function (f) {
        f.onsubmit = function (ev) {
          ev.preventDefault();
          regBaja(a, v('fb-causa'), v('fb-fecha') || hoy());
          listo('Baja registrada.');
        };
      });
  }

  /* Mover o vacunar a los animales elegidos en la lista del hato (pueden venir de potreros distintos). */
  function formSeleccion(modo, l, alTerminar) {
    if (!l.length) return aviso('Seleccione al menos un animal.', true);
    var esMover = modo === 'mover', n = l.length + (l.length === 1 ? ' animal' : ' animales');
    var desde = {}; l.forEach(function (a) { var k = nombrePotrero(a.potrero_id); desde[k] = (desde[k] || 0) + 1; });
    var resumen = Object.keys(desde).map(function (k) { return desde[k] + ' de ' + k; }).join(' · ');
    abrirHoja(esMover ? 'Mover ' + n : 'Vacunar o tratar ' + n,
      '<p class="ayuda-sel">' + e(resumen) + '</p>' +
      '<div class="sel-avatares">' + l.slice(0, 12).map(function (a) { return avatarAnimal(a, 'chico'); }).join('') + (l.length > 12 ? '<span class="avatar chico mas">+' + (l.length - 12) + '</span>' : '') + '</div>' +
      (esMover ? campo('fs-a', 'Hacia', '<select id="fs-a">' + opcionesPotrero('') + '</select>')
        : '<div class="campo"><span class="rotulo">Tipo</span>' + seg('fs-tipo', [['vacuna', 'Vacuna'], ['tratamiento', 'Tratamiento']], 'vacuna') + '</div>' +
          campo('fs-prod', 'Producto o motivo', entrada('fs-prod', 'text', '', ' maxlength="80" placeholder="Ej. Desparasitante"')) +
          (puedeDinero() ? campo('fs-costo', 'Costo total (opcional)', entrada('fs-costo', 'number', '', ' inputmode="decimal" min="0" step="any"'), 'Se anota como un solo gasto.') : '')) +
      campo('fs-fecha', 'Fecha', entrada('fs-fecha', 'date', hoy(), ' max="' + hoy() + '"')),
      '<button type="submit" class="btn ancho" id="fs-ok">' + (esMover ? 'Mover ' : 'Registrar a ') + n + '</button>',
      function (f) {
        if (esMover) hoja.querySelector('#fs-a').onchange = function () { delete f.dataset.ok; hoja.querySelector('#fs-ok').textContent = 'Mover ' + n; };
        f.onsubmit = function (ev) {
          ev.preventDefault(); limpiarErrores();
          var fe = v('fs-fecha') || hoy();
          if (esMover) {
            var a2 = v('fs-a'); if (!a2) return marcarError('fs-a', 'Elija a qué potrero.');
            var p2 = buscarId('campo_potreros', a2);
            if (p2.agua === 'sin_agua' && !f.dataset.ok) { f.dataset.ok = '1'; hoja.querySelector('#fs-ok').textContent = 'Sí, moverlos aunque no tenga agua'; return marcarError('fs-a', p2.nombre + ' está marcado sin agua.'); }
            var mov = l.filter(function (a) { return a.potrero_id !== a2; });
            if (!mov.length) return marcarError('fs-a', 'Esos animales ya están en ' + p2.nombre + '.');
            mov.forEach(function (a) { var o = nombrePotrero(a.potrero_id); guardar('campo_animales', { id: a.id, potrero_id: a2 }); evento(a, 'movimiento', { fecha: fe, detalle: 'De ' + o + ' a ' + p2.nombre }); });
            if (alTerminar) alTerminar();
            listo(mov.length + (mov.length === 1 ? ' animal movido' : ' animales movidos') + ' a ' + p2.nombre + '.');
          } else {
            var prod = v('fs-prod'), costo = num(v('fs-costo'));
            if (!prod) return marcarError('fs-prod', 'Escriba el producto o el motivo.');
            var tipo = grupo('fs-tipo') || 'vacuna';
            l.forEach(function (a) { evento(a, tipo, { fecha: fe, detalle: prod }); });
            if (costo > 0) guardar('campo_finanzas', { tipo: 'gasto', categoria: 'Medicinas y vacunas', concepto: prod + ' · ' + n, monto: costo, fecha: fe });
            if (alTerminar) alTerminar();
            listo('Registrado a ' + n + '.');
          }
        };
      });
  }
  function formLote(modo, potreroId) {
    var esMover = modo === 'mover';
    var conGanado = tabla('campo_potreros').filter(function (p) { return activos().some(function (a) { return a.potrero_id === p.id; }); });
    if (!conGanado.length) return aviso('No hay potreros con ganado. Asigne potrero a sus animales primero.', true);
    var de = potreroId || conGanado[0].id;
    abrirHoja(esMover ? 'Mover ganado' : 'Vacunar o tratar lote',
      campo('fl-de', esMover ? 'Desde' : 'Potrero', '<select id="fl-de">' + conGanado.map(function (p) { return '<option value="' + p.id + '"' + (p.id === de ? ' selected' : '') + '>' + e(p.nombre) + '</option>'; }).join('') + '</select>') +
      (esMover ? campo('fl-a', 'Hacia', '<select id="fl-a">' + opcionesPotrero((tabla('campo_potreros').filter(function (p) { return p.id !== de; })[0] || {}).id || '') + '</select>') : '') +
      '<div class="campo cuantos"><span class="rotulo">Cuántos</span>' +
      '<div class="cuantos-fila"><label for="fl-nh">Hembras <small id="fl-th"></small></label><input id="fl-nh" type="number" inputmode="numeric" min="0" step="1" placeholder="Todas"></div>' +
      '<div class="cuantos-fila"><label for="fl-nm">Machos <small id="fl-tm"></small></label><input id="fl-nm" type="number" inputmode="numeric" min="0" step="1" placeholder="Todos"></div>' +
      '<p class="ayuda">Vacío = todos. Ponga 0 si no quiere mover ninguno.</p></div>' +
      '<div class="campo lote"><button type="button" class="lote-abrir" id="fl-abrir" aria-expanded="false"><span id="fl-cuenta"></span><span>Elegir uno por uno ' + ico('chev') + '</span></button>' +
      '<div id="fl-detalle" hidden><div class="lote-cab"><input id="fl-busca" type="search" inputmode="search" placeholder="Buscar arete" aria-label="Buscar arete" autocomplete="off"><button type="button" id="fl-todos"></button></div>' +
      '<ul class="lote-lista" id="fl-lista"></ul></div></div>' +
      (esMover ? ''
        : '<div class="campo"><span class="rotulo">Tipo</span>' + seg('fl-tipo', [['vacuna', 'Vacuna'], ['tratamiento', 'Tratamiento']], 'vacuna') + '</div>' +
          campo('fl-prod', 'Producto o motivo', entrada('fl-prod', 'text', '', ' maxlength="80" placeholder="Ej. Desparasitante"')) +
          (puedeDinero() ? campo('fl-costo', 'Costo total (opcional)', entrada('fl-costo', 'number', '', ' inputmode="decimal" min="0" step="any"'), 'Se anota como un solo gasto.') : '')) +
      campo('fl-fecha', 'Fecha', entrada('fl-fecha', 'date', hoy(), ' max="' + hoy() + '"')),
      '<button type="submit" class="btn ancho" id="fl-ok"></button>',
      function (f) {
        // Por cantidad: "70 hembras y 20 machos" (vacío = todos). Se toman en orden de arete,
        // y la lista de abajo deja quitar o agregar uno por uno.
        var quitados = {};
        var orden = function (a, b) { return String(a.arete).localeCompare(String(b.arete), 'es', { numeric: true }); };
        var enPotrero = function () { return activos().filter(function (a) { return a.potrero_id === v('fl-de'); }).sort(orden); };
        var grupoAnimales = function () { return enPotrero().filter(function (a) { return !quitados[a.id]; }); };
        var etiquetar = function () {
          var base = enPotrero(), sel = grupoAnimales(), n = sel.length; delete f.dataset.ok;
          var h = sel.filter(function (a) { return a.sexo === 'hembra'; }).length;
          hoja.querySelector('#fl-ok').textContent = (esMover ? 'Mover ' : 'Registrar a ') + n + (n === 1 ? ' animal' : ' animales');
          hoja.querySelector('#fl-cuenta').textContent = n + ' de ' + base.length + ' · ' + h + ' H, ' + (n - h) + ' M';
          hoja.querySelector('#fl-todos').textContent = n ? 'Quitar todos' : 'Marcar todos';
        };
        var pintarLista = function () {
          var t = normArete(v('fl-busca')), l = enPotrero().filter(function (a) { return !t || normArete(a.arete).indexOf(t) > -1 || (a.nombre && a.nombre.toLowerCase().indexOf(t) > -1); });
          hoja.querySelector('#fl-lista').innerHTML = l.length ? l.map(function (a) {
            return '<li><label><input type="checkbox" data-id="' + a.id + '"' + (quitados[a.id] ? '' : ' checked') + '>' + avatarAnimal(a, 'chico') +
              '<span><b>' + e(a.arete) + (a.nombre ? ' · ' + e(a.nombre) : '') + '</b><small>' + NOMBRE_CAT[a.categoria] + (a.peso ? ' · ' + kg(a.peso) : '') + '</small></span><i class="palomita" aria-hidden="true"></i></label></li>';
          }).join('') : '<li class="nada">Sin animales con ese filtro</li>';
          hoja.querySelectorAll('#fl-lista input').forEach(function (c) { c.onchange = function () { if (c.checked) delete quitados[c.dataset.id]; else quitados[c.dataset.id] = 1; etiquetar(); }; });
          etiquetar();
        };
        var porCantidad = function () {
          var base = enPotrero(); quitados = {};
          [['hembra', 'fl-nh', 'fl-th'], ['macho', 'fl-nm', 'fl-tm']].forEach(function (x) {
            var l = base.filter(function (a) { return a.sexo === x[0]; }), inp = hoja.querySelector('#' + x[1]);
            hoja.querySelector('#' + x[2]).textContent = 'de ' + l.length;
            inp.max = l.length; inp.disabled = !l.length;
            var c = inp.value === '' ? l.length : Math.max(0, Math.min(l.length, Math.floor(+inp.value) || 0));
            l.slice(c).forEach(function (a) { quitados[a.id] = 1; });
            inp.closest('.cuantos-fila').classList.toggle('error', inp.value !== '' && +inp.value > l.length);
          });
          pintarLista();
        };
        hoja.querySelector('#fl-nh').oninput = hoja.querySelector('#fl-nm').oninput = porCantidad;
        hoja.querySelector('#fl-abrir').onclick = function () {
          var d = hoja.querySelector('#fl-detalle'); d.hidden = !d.hidden; this.setAttribute('aria-expanded', !d.hidden);
        };
        hoja.querySelector('#fl-todos').onclick = function () {
          var hay = grupoAnimales().length; enPotrero().forEach(function (a) { if (hay) quitados[a.id] = 1; else delete quitados[a.id]; }); pintarLista();
        };
        hoja.querySelector('#fl-busca').oninput = pintarLista;
        hoja.querySelector('#fl-busca').onkeydown = function (ev) { if (ev.key === 'Enter') ev.preventDefault(); };
        hoja.querySelector('#fl-de').onchange = function () { hoja.querySelector('#fl-nh').value = hoja.querySelector('#fl-nm').value = ''; porCantidad(); };
        if (esMover) hoja.querySelector('#fl-a').onchange = etiquetar;
        porCantidad();
        f.onsubmit = function (ev) {
          ev.preventDefault(); limpiarErrores();
          var l = grupoAnimales(), fe = v('fl-fecha') || hoy();
          if (!l.length) return aviso('No hay animales con ese filtro.', true);
          if (esMover) {
            var a2 = v('fl-a');
            if (!a2 || a2 === v('fl-de')) return marcarError('fl-a', 'Elija un potrero distinto.');
            var p2 = buscarId('campo_potreros', a2);
            if (p2.agua === 'sin_agua' && !f.dataset.ok) { f.dataset.ok = '1'; hoja.querySelector('#fl-ok').textContent = 'Sí, moverlos aunque no tenga agua'; return marcarError('fl-a', p2.nombre + ' está marcado sin agua.'); }
            var origen = nombrePotrero(v('fl-de'));
            l.forEach(function (a) { guardar('campo_animales', { id: a.id, potrero_id: a2 }); evento(a, 'movimiento', { fecha: fe, detalle: 'De ' + origen + ' a ' + p2.nombre }); });
            listo(l.length + (l.length === 1 ? ' animal movido' : ' animales movidos') + ' a ' + p2.nombre + '.');
          } else {
            var prod = v('fl-prod'), costo = num(v('fl-costo'));
            if (!prod) return marcarError('fl-prod', 'Escriba el producto o el motivo.');
            var tipo = grupo('fl-tipo') || 'vacuna';
            l.forEach(function (a) { evento(a, tipo, { fecha: fe, detalle: prod }); });
            if (costo > 0) guardar('campo_finanzas', { tipo: 'gasto', categoria: 'Medicinas y vacunas', concepto: prod + ' · ' + l.length + ' animales de ' + nombrePotrero(v('fl-de')), monto: costo, fecha: fe });
            listo('Registrado a ' + l.length + (l.length === 1 ? ' animal.' : ' animales.'));
          }
        };
      });
  }

  function formDinero(f0, tipo0, extra) {
    extra = extra || {};
    var dd = extra.datos || {};
    var nuevo = !f0; f0 = f0 || { tipo: dd.tipo || tipo0 || 'gasto', fecha: dd.fecha || hoy(), monto: dd.monto, proveedor: dd.proveedor, concepto: dd.concepto, categoria: dd.categoria };
    var cats = function (t) { return t === 'ingreso' ? CAT_INGRESO : CAT_GASTO; };
    var chips = function (t, sel) { return cats(t).map(function (c) { return '<button data-v="' + e(c) + '" aria-pressed="' + (c === sel) + '">' + e(c) + '</button>'; }).join(''); };
    abrirHoja(nuevo ? (f0.tipo === 'ingreso' ? 'Nuevo ingreso' : 'Nuevo gasto') : 'Editar movimiento',
      (extra.nota ? '<div class="leido' + (dd.monto ? '' : ' mal') + '">' + (extra.foto ? '<img src="' + extra.foto + '" alt="Foto del ticket">' : '<span class="leido-ico">' + ico(extra.icono || (extra.origen === 'audio' ? 'mic' : 'foto')) + '</span>') + '<p>' + e(extra.nota) + '</p></div>' : '') +
      '<div class="campo">' + seg('fd-tipo', [['gasto', 'Gasto'], ['ingreso', 'Ingreso']], f0.tipo) + '</div>' +
      campo('fd-monto', 'Monto', '<div class="monto"><span>$</span>' + entrada('fd-monto', 'number', f0.monto, ' inputmode="decimal" min="0" step="any" required') + '</div>') +
      '<div class="campo"><span class="rotulo">Categoría</span><div class="opciones" id="fd-cat" data-valor="' + e(f0.categoria || '') + '">' + chips(f0.tipo, f0.categoria) + '</div></div>' +
      campo('fd-concepto', 'Concepto', entrada('fd-concepto', 'text', f0.concepto, ' maxlength="120" placeholder="Ej. 40 pacas de avena"')) +
      '<div class="dos-campos">' + campo('fd-prov', 'Proveedor o cliente', entrada('fd-prov', 'text', f0.proveedor, ' maxlength="80"')) +
      campo('fd-fecha', 'Fecha', entrada('fd-fecha', 'date', f0.fecha, ' max="' + hoy() + '"')) + '</div>' +
      (f0.ticket_path ? '<button type="button" class="btn sec ancho" id="fd-ver" style="margin-bottom:10px">' + ico('foto') + 'Ver foto del ticket</button>' : '') +
      (!nuevo && puedeBorrar() ? '<button type="button" class="btn peligro ancho" id="fd-borrar">' + ico('borrar') + 'Borrar movimiento</button>' : ''),
      '<button type="submit" class="btn ancho">Guardar</button>',
      function (f) {
        var segT = hoja.querySelector('#fd-tipo'), opc = hoja.querySelector('#fd-cat');
        var enlazar = function () {
          opc.querySelectorAll('button').forEach(function (b) { b.type = 'button'; b.onclick = function () { opc.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); opc.dataset.valor = b.dataset.v; }; });
        };
        segT.onelegir = function (t) { opc.innerHTML = chips(t, ''); opc.dataset.valor = ''; enlazar(); hoja.querySelector('#hoja-titulo').textContent = nuevo ? (t === 'ingreso' ? 'Nuevo ingreso' : 'Nuevo gasto') : 'Editar movimiento'; };
        enlazar();
        var ver = hoja.querySelector('#fd-ver');
        if (ver) ver.onclick = async function () {
          if (!navigator.onLine) return aviso('Para ver la foto se necesita señal.', true);
          var r = await sb.storage.from('campo-tickets').createSignedUrl(f0.ticket_path, 300);
          if (r.error) return aviso('No se pudo abrir la foto.', true);
          window.open(r.data.signedUrl, '_blank', 'noopener');
        };
        var bb = hoja.querySelector('#fd-borrar');
        if (bb) bb.onclick = function () {
          if (!bb.dataset.ok) { bb.dataset.ok = '1'; bb.textContent = 'Toque otra vez para borrar'; return; }
          if (f0.ticket_path && navigator.onLine) sb.storage.from('campo-tickets').remove([f0.ticket_path]);
          borrar('campo_finanzas', f0.id); listo('Movimiento borrado.');
        };
        f.onsubmit = function (ev) {
          ev.preventDefault(); limpiarErrores();
          var monto = num(v('fd-monto')), cat = opc.dataset.valor;
          if (!(monto > 0)) return marcarError('fd-monto', 'Escriba el monto.');
          if (!cat) return aviso('Elija una categoría.', true);
          guardar('campo_finanzas', { id: f0.id, tipo: grupo('fd-tipo') || 'gasto', monto: monto, categoria: cat, concepto: v('fd-concepto') || null, proveedor: v('fd-prov') || null, fecha: v('fd-fecha') || hoy(), animal_id: f0.animal_id || null,
            ticket_path: f0.ticket_path || extra.ticket_path || null, origen: f0.origen || extra.origen || 'manual' });
          listo(nuevo ? 'Guardado.' : 'Cambios guardados.');
        };
      });
  }

  function formPotrero(p) {
    var nuevo = !p; p = p || { agua: 'con_agua' };
    abrirHoja(nuevo ? 'Potrero nuevo' : 'Editar potrero',
      campo('fpo-nombre', 'Nombre', entrada('fpo-nombre', 'text', p.nombre, ' maxlength="60" required placeholder="Ej. La Cañada"')) +
      campo('fpo-ha', 'Hectáreas (opcional)', entrada('fpo-ha', 'number', p.hectareas, ' inputmode="decimal" min="0" step="any"')) +
      '<div class="campo"><span class="rotulo">Agua</span>' + seg('fpo-agua', [['con_agua', 'Con agua'], ['baja', 'Baja'], ['sin_agua', 'Sin agua']], p.agua) + '</div>' +
      campo('fpo-notas', 'Notas', '<textarea id="fpo-notas" maxlength="300">' + e(p.notas || '') + '</textarea>') +
      (!nuevo && puedeBorrar() ? '<button type="button" class="btn peligro ancho" id="fpo-borrar">' + ico('borrar') + 'Borrar potrero</button>' : ''),
      '<button type="submit" class="btn ancho">Guardar</button>',
      function (f) {
        var bb = hoja.querySelector('#fpo-borrar');
        if (bb) bb.onclick = function () {
          var n = activos().filter(function (a) { return a.potrero_id === p.id; }).length;
          if (n) return aviso('Primero mueva los ' + n + ' animales que están ahí.', true);
          if (!bb.dataset.ok) { bb.dataset.ok = '1'; bb.textContent = 'Toque otra vez para borrar'; return; }
          borrar('campo_potreros', p.id); hoja.close(); aviso('Potrero borrado.'); location.hash = '#/potreros'; subir();
        };
        f.onsubmit = function (ev) {
          ev.preventDefault(); limpiarErrores();
          var n = v('fpo-nombre');
          if (!n) return marcarError('fpo-nombre', 'Escriba el nombre del potrero.');
          if (tabla('campo_potreros').some(function (x) { return x.nombre.toLowerCase() === n.toLowerCase() && x.id !== p.id; })) return marcarError('fpo-nombre', 'Ya hay un potrero con ese nombre.');
          var ha = v('fpo-ha') === '' ? null : num(v('fpo-ha'));
          guardar('campo_potreros', { id: p.id, nombre: n, hectareas: ha, agua: grupo('fpo-agua') || 'con_agua', notas: v('fpo-notas') || null });
          listo(nuevo ? 'Potrero agregado.' : 'Cambios guardados.');
        };
      });
  }
  function formAgua(p) {
    abrirHoja('Agua en ' + p.nombre,
      '<div class="campo">' + seg('fag', [['con_agua', 'Con agua'], ['baja', 'Baja'], ['sin_agua', 'Sin agua']], p.agua) + '</div>',
      '<button type="submit" class="btn ancho">Guardar</button>',
      function (f) { f.onsubmit = function (ev) { ev.preventDefault(); guardar('campo_potreros', { id: p.id, agua: grupo('fag') || p.agua }); listo('Agua actualizada.'); }; });
  }

  /* ---------- Captura por foto de ticket y por voz ---------- */
  function comprimir(archivo) {
    return new Promise(function (ok, mal) {
      var img = new Image(), u = URL.createObjectURL(archivo);
      img.onload = function () {
        var esc = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        c.toBlob(function (b) { b ? ok(b) : mal(new Error('foto')); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(u); mal(new Error('foto')); };
      img.src = u;
    });
  }
  async function leerConIA(tipo, blob, nombre, campos) {
    var fd = new FormData();
    fd.append('rancho_id', S.rancho.id); fd.append('tipo', tipo);
    if (blob) fd.append('archivo', blob, nombre);
    Object.keys(campos || {}).forEach(function (k) { fd.append(k, campos[k]); });
    var r = await sb.functions.invoke('campo-leer', { body: fd });
    if (r.error) {
      var msg = 'No se pudo leer.';
      try { var j = await r.error.context.json(); if (j && j.error) msg = j.error; } catch (x) {}
      throw new Error(msg);
    }
    return r.data;
  }
  function capturarTicket() {
    if (!navigator.onLine) return aviso('Para leer el ticket se necesita señal. Puede capturarlo a mano.', true);
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; inp.setAttribute('capture', 'environment'); inp.hidden = true;
    document.body.appendChild(inp);
    inp.onchange = async function () {
      var f = inp.files[0]; inp.remove();
      if (!f) return;
      var blob;
      try { blob = await comprimir(f); } catch (x) { return aviso('No se pudo abrir la foto.', true); }
      var url = URL.createObjectURL(blob);
      abrirHoja('Leyendo ticket', '<div class="leyendo"><img src="' + url + '" alt="Foto del ticket"><div class="girando" aria-hidden="true"></div><p>Leyendo monto, fecha y proveedor…</p></div>', '');
      var ruta = S.rancho.id + '/' + uuid() + '.jpg';
      var subida = sb.storage.from('campo-tickets').upload(ruta, blob, { contentType: 'image/jpeg' });
      var datos = null, error = null;
      try { datos = (await leerConIA('foto', blob, 'ticket.jpg')).datos; } catch (x) { error = x.message; }
      var s = await subida, guardada = !s.error;
      formDinero(null, 'gasto', {
        datos: datos, foto: url, origen: 'ticket', ticket_path: guardada ? ruta : null,
        nota: (error ? error + ' Captúrelo a mano.' : datos && datos.monto ? 'Leído del ticket. Revise los datos antes de guardar.' : 'No encontré el total. Revise y complete los datos.') + (guardada ? '' : ' La foto no se pudo guardar.')
      });
    };
    inp.click();
  }
  function dictar() {
    grabarAudio({ titulo: 'Dictar gasto', instruccion: 'Diga qué compró, cuánto pagó y a quién.', ejemplo: 'Pagué 4,400 de pacas de avena en Forrajes Delicias', tipo: 'audio',
      alResponder: function (r) { formDinero(null, 'gasto', { datos: r.datos, origen: 'audio', nota: (r.texto ? 'Escuché: “' + r.texto.replace(/[.\s]+$/, '') + '”. ' : '') + 'Revise los datos antes de guardar.' }); } });
  }
  /* Lo escrito en la caja de Dinero ("diésel 2350") se convierte en un gasto para revisar */
  async function interpretarDinero(texto, btn) {
    if (!navigator.onLine) return formDinero(null, 'gasto', { datos: { concepto: texto } });
    btn.disabled = true; btn.innerHTML = '<span class="girando" style="width:20px;height:20px;margin:0;border-width:2px"></span>';
    try {
      var r = await leerConIA('texto', null, '', { texto: texto });
      formDinero(null, 'gasto', { datos: r.datos, icono: 'escribir', nota: 'Entendí: “' + texto + '”. Revise los datos antes de guardar.' });
    } catch (x) {
      formDinero(null, 'gasto', { datos: { concepto: texto } });
      aviso(x.message, true);
    }
    btn.disabled = false; btn.innerHTML = ico('mic');
  }
  function dictarGanado(arete) {
    grabarAudio({ titulo: arete ? 'Dictar · arete ' + arete : 'Dictar al ganado',
      instruccion: arete ? 'Diga lo que pasó con este animal.' : 'Diga el arete y lo que pasó. Puede decir varios animales seguidos.',
      ejemplo: arete ? 'Pesó 520 kilos y la vacunamos con clostridial' : 'Parió la 432 becerra, y vacunamos a la 118 con clostridial', tipo: 'audio-ganado',
      campos: { potreros: JSON.stringify(tabla('campo_potreros').map(function (p) { return p.nombre; })), arete: arete || '' },
      alResponder: confirmarAcciones });
  }
  function grabarAudio(cfg) {
    if (!navigator.onLine) return aviso('Para dictar se necesita señal. Puede capturarlo a mano.', true);
    if (!navigator.mediaDevices || !window.MediaRecorder) return aviso('Este teléfono no permite grabar aquí. Use la captura a mano.', true);
    abrirHoja(cfg.titulo,
      '<div class="dictado"><p>' + e(cfg.instruccion) + '</p><p class="ejemplo">“' + e(cfg.ejemplo) + '”</p>' +
      '<button type="button" class="mic" id="mic" aria-label="Empezar a grabar">' + ico('mic') + '</button><p class="estado-mic" id="mic-estado" aria-live="polite">Toque para hablar</p></div>', '');
    var btn = hoja.querySelector('#mic'), est = hoja.querySelector('#mic-estado'), rec = null, trozos = [], reloj = null, flujo = null, tipo = '';
    var soltar = function () { clearInterval(reloj); if (flujo) flujo.getTracks().forEach(function (t) { t.stop(); }); };
    hoja.addEventListener('close', function cerrar() { hoja.removeEventListener('close', cerrar); if (rec && rec.state === 'recording') { rec.onstop = null; rec.stop(); } soltar(); });
    btn.onclick = async function () {
      if (rec && rec.state === 'recording') { rec.stop(); return; }
      try { flujo = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (x) { est.textContent = 'Permita el micrófono para poder dictar.'; return; }
      tipo = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].filter(function (t) { return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t); })[0] || '';
      rec = new MediaRecorder(flujo, tipo ? { mimeType: tipo } : undefined); trozos = [];
      rec.ondataavailable = function (ev) { if (ev.data && ev.data.size) trozos.push(ev.data); };
      rec.onstop = async function () {
        soltar(); btn.classList.remove('grabando'); btn.disabled = true; est.textContent = 'Entendiendo…';
        var mime = rec.mimeType || tipo || 'audio/webm', ext = /mp4/.test(mime) ? 'm4a' : /ogg/.test(mime) ? 'ogg' : 'webm';
        var blob = new Blob(trozos, { type: mime });
        if (blob.size < 1500) { btn.disabled = false; est.textContent = 'No se escuchó nada. Toque para intentar otra vez.'; return; }
        try { cfg.alResponder(await leerConIA(cfg.tipo, blob, 'audio.' + ext, cfg.campos)); }
        catch (x) { btn.disabled = false; est.textContent = x.message; }
      };
      rec.start();
      var t0 = Date.now();
      btn.classList.add('grabando'); btn.setAttribute('aria-label', 'Terminar de grabar');
      est.textContent = 'Grabando… toque para terminar';
      reloj = setInterval(function () { var s = Math.floor((Date.now() - t0) / 1000); est.textContent = 'Grabando ' + s + ' s · toque para terminar'; if (s >= 60) rec.stop(); }, 300);
    };
  }

  /* Lo dictado al ganado se revisa antes de guardar */
  function sinAcentos(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function normArete(x) { return String(x || '').toLowerCase().replace(/[\s-]/g, '').replace(/^0+(?=\w)/, ''); }
  function buscarArete(arete) { var k = normArete(arete); return tabla('campo_animales').filter(function (a) { return normArete(a.arete) === k; })[0] || null; }
  function buscarPotrero(nombre) {
    if (!nombre) return null;
    var sin = function (t) { return sinAcentos(t).replace(/^(el|la|los|las)\s+/, '').trim(); }, k = sin(nombre);
    return tabla('campo_potreros').filter(function (p) { var n = sin(p.nombre); return n === k || n.indexOf(k) > -1 || k.indexOf(n) > -1; })[0] || null;
  }
  function describirAccion(x, a) {
    var t = EVENTOS[x.tipo] || EVENTOS.nota, d ={ titulo: t[0], icono: t[1], sub: '', error: '' };
    if (!a) { d.error = 'No encontré el arete ' + x.arete + ' en el rancho.'; return d; }
    if (a.estado !== 'activo' && x.tipo !== 'nota') { d.error = 'El arete ' + a.arete + ' ya está ' + (a.estado === 'vendido' ? 'vendido' : 'dado de baja') + '.'; return d; }
    if (x.tipo === 'pesaje' || x.tipo === 'destete') { d.sub = kg(x.peso); if (!x.peso) d.error = 'Falta el peso.'; }
    else if (x.tipo === 'vacuna' || x.tipo === 'tratamiento') { d.sub = x.producto || ''; if (!x.producto) d.error = 'Falta el producto.'; }
    else if (x.tipo === 'parto') {
      d.sub = (x.cria_sexo === 'macho' ? 'Becerro' : 'Becerra') + (x.cria_arete ? ' ' + x.cria_arete : ' sin arete todavía');
      if (a.sexo !== 'hembra') d.error = 'El arete ' + a.arete + ' es macho.';
      else if (x.cria_arete && !areteLibre(x.cria_arete)) d.error = 'Ya existe un animal con el arete ' + x.cria_arete + '.';
    }
    else if (x.tipo === 'prenez') { d.sub = (x.resultado || 'Preñada') + (x.resultado !== 'Vacía' && x.meses ? ', ' + x.meses + ' meses' : ''); if (a.sexo !== 'hembra') d.error = 'El arete ' + a.arete + ' es macho.'; }
    else if (x.tipo === 'movimiento') {
      var p = buscarPotrero(x.potrero);
      d.sub = 'A ' + (p ? p.nombre : x.potrero || '¿?');
      if (!p) d.error = x.potrero ? 'No encontré el potrero “' + x.potrero + '”.' : 'Falta a qué potrero.';
      else if (p.id === a.potrero_id) d.error = 'Ya está en ' + p.nombre + '.';
    }
    else if (x.tipo === 'nota') { d.sub = x.detalle || ''; if (!x.detalle) d.error = 'La nota está vacía.'; }
    else if (x.tipo === 'muerte') { d.sub = x.detalle || 'Sin causa'; }
    else if (x.tipo === 'venta') { d.sub = (x.precio ? pesos(x.precio) : '') + (x.comprador ? ' · ' + x.comprador : ''); if (!x.precio) d.error = 'Falta el precio de venta.'; }
    if (x.fecha && x.fecha !== hoy()) d.sub += (d.sub ? ' · ' : '') + fecha(x.fecha);
    return d;
  }
  function aplicarAccion(x, a) {
    var fe = x.fecha || hoy();
    if (x.tipo === 'pesaje') regPesaje(a, x.peso, fe);
    else if (x.tipo === 'destete') regDestete(a, x.peso, fe);
    else if (x.tipo === 'vacuna' || x.tipo === 'tratamiento') regTratamiento(a, x.tipo, x.producto, fe, null);
    else if (x.tipo === 'parto') regParto(a, { fecha: fe, sexo: x.cria_sexo || 'hembra', arete: x.cria_arete || '', peso: null, nota: x.detalle });
    else if (x.tipo === 'prenez') regPrenez(a, x.resultado || 'Preñada', x.meses, fe);
    else if (x.tipo === 'movimiento') regMover(a, buscarPotrero(x.potrero).id, fe);
    else if (x.tipo === 'nota') evento(a, 'nota', { fecha: fe, detalle: x.detalle });
    else if (x.tipo === 'muerte') regBaja(a, x.detalle, fe);
    else if (x.tipo === 'venta') regVenta(a, { precio: x.precio, peso: null, comprador: x.comprador, fecha: fe });
  }
  function confirmarAcciones(r) {
    // El destete ya guarda el peso: si también viene un pesaje igual del mismo arete, sobra.
    var acc = (r.acciones || []).filter(function (x, k, todas) {
      return !(x.tipo === 'pesaje' && todas.some(function (y) { return y.tipo === 'destete' && normArete(y.arete) === normArete(x.arete) && (!x.peso || +y.peso === +x.peso); }));
    });
    var l = acc.map(function (x) { var a = buscarArete(x.arete); return { x: x, a: a, d: describirAccion(x, a) }; });
    var escuche = r.texto ? '<div class="leido' + (l.some(function (i) { return !i.d.error; }) ? '' : ' mal') + '"><span class="leido-ico">' + ico(r.escrito ? 'escribir' : 'mic') + '</span><p>' + (r.escrito ? 'Entendí' : 'Escuché') + ': “' + e(r.texto.replace(/[.\s]+$/, '')) + '”</p></div>' : '';
    if (!l.length) {
      abrirHoja('Dictar al ganado', escuche + '<div class="vacio"><b>No encontré acciones con arete</b>Diga el número de arete y lo que pasó, por ejemplo “la 432 parió becerra”.</div>',
        '<button type="button" class="btn ancho" id="otra-vez">' + ico('mic') + 'Intentar otra vez</button>');
      hoja.querySelector('#otra-vez').onclick = function () { dictarGanado(); };
      return;
    }
    abrirHoja('Revise antes de guardar', escuche + '<ul class="acciones-voz">' + l.map(function (i, k) {
      return '<li' + (i.d.error ? ' class="con-error"' : '') + '><label><input type="checkbox" data-k="' + k + '"' + (i.d.error ? ' disabled' : ' checked') + '>' +
        '<span class="avatar">' + ico(i.d.icono) + '</span><span class="fila-cuerpo"><span class="fila-titulo">' + e(i.d.titulo) + ' · arete ' + e(i.a ? i.a.arete : i.x.arete) + '</span>' +
        '<span class="fila-sub">' + e(i.d.error || i.d.sub) + '</span></span></label></li>';
    }).join('') + '</ul>',
      '<button type="button" class="btn sec" id="otra-vez">' + ico('mic') + 'Repetir</button><button type="submit" class="btn" id="guardar-voz"></button>',
      function (f) {
        var cajas = hoja.querySelectorAll('.acciones-voz input'), boton = hoja.querySelector('#guardar-voz');
        var contar = function () { var n = Array.prototype.filter.call(cajas, function (c) { return c.checked; }).length; boton.textContent = n ? 'Guardar ' + n : 'Nada marcado'; boton.disabled = !n; return n; };
        cajas.forEach(function (c) { c.onchange = contar; });
        contar();
        hoja.querySelector('#otra-vez').onclick = function () { dictarGanado(); };
        f.onsubmit = function (ev) {
          ev.preventDefault();
          var n = 0;
          cajas.forEach(function (c) { if (c.checked) { var i = l[+c.dataset.k]; aplicarAccion(i.x, buscarId('campo_animales', i.a.id) || i.a); n++; } });
          listo(n + (n === 1 ? ' registro guardado.' : ' registros guardados.'));
        };
      });
  }

  /* ---------- Exportar ---------- */
  function descargarCSV(nombre, filas) {
    var q = function (x) { x = x == null ? '' : String(x); if (/^[=+\-@]/.test(x)) x = "'" + x; return '"' + x.replace(/"/g, '""') + '"'; };
    var blob = new Blob(['﻿' + filas.map(function (r) { return r.map(q).join(','); }).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var u = URL.createObjectURL(blob), l = document.createElement('a');
    l.href = u; l.download = nombre; document.body.appendChild(l); l.click(); l.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
    aviso('Archivo descargado.');
  }
  function csvGanado() {
    var l = tabla('campo_animales').slice().sort(ordenArete);
    descargarCSV('ganado_' + hoy() + '.csv', [['Arete', 'Nombre', 'Sexo', 'Tipo', 'Raza', 'Color', 'Nacimiento', 'Peso kg', 'Potrero', 'Madre', 'Estado', 'Notas']].concat(l.map(function (a) {
      var m = a.madre_id && buscarId('campo_animales', a.madre_id);
      return [a.arete, a.nombre, a.sexo, NOMBRE_CAT[a.categoria], a.raza, a.color, a.nacimiento, a.peso, a.potrero_id ? nombrePotrero(a.potrero_id) : '', m ? m.arete : '', a.estado, a.notas];
    })));
  }
  function csvDinero() {
    var l = tabla('campo_finanzas').slice().sort(function (a, b) { return a.fecha.localeCompare(b.fecha); });
    descargarCSV('dinero_' + hoy() + '.csv', [['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Proveedor o cliente', 'Monto']].concat(l.map(function (f) { return [f.fecha, f.tipo, f.categoria, f.concepto, f.proveedor, f.monto]; })));
  }

  /* ---------- Arranque ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(function () {});
  sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_OUT' && S.rancho) location.reload(); });
  iniciar();
  setInterval(function () { if (S.cola.length && navigator.onLine) subir(); }, 20000);
})();
