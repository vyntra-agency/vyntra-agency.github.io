// La bienvenida dura lo que tarda la animación (2.3 s); la app se arma detrás mientras tanto.
(function () {
  var b = document.getElementById('bienvenida'), corto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!b) return;
  setTimeout(function () { b.classList.add('fuera'); setTimeout(function () { b.remove(); }, 500); }, corto ? 500 : 2300);
})();
