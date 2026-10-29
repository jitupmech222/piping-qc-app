// security-lock.js - Security & DevTools Blocker

// ૧. માઉસનું રાઇટ-ક્લિક બંધ કરવું
document.addEventListener('contextmenu', function (e) {
  e.preventDefault();
});

// ૨. F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S લૉક કરવું
document.addEventListener('keydown', function (e) {
  if (e.key === 'F12' || e.keyCode === 123) {
    e.preventDefault();
    return false;
  }
  if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
    e.preventDefault();
    return false;
  }
  if (e.ctrlKey && ['U', 'u', 'S', 's'].includes(e.key)) {
    e.preventDefault();
    return false;
  }
});

// ૩. DevTools ડિટેક્ટ થાય તો સ્ક્રીન ફ્રીઝ કરવી
setInterval(function () {
  const startTime = performance.now();
  debugger;
  const endTime = performance.now();
  if (endTime - startTime > 100) {
    document.body.innerHTML = '<h2 style="color:red; text-align:center; margin-top:20%;">⚠️ Developer Tools detected. Access is disabled for security reasons.</h2>';
  }
}, 1000);
