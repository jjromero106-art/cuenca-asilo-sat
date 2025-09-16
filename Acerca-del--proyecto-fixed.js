// Variables globales
let datosConsultados = [];
let paginaActual = 0;
let tipoPaginacion = 'dias';
let datosPaginados = [];

// Función principal para consultar datos
function consultarDatos() {
  console.log('Iniciando consultarDatos...');
  $('#myPlot').html('<div style="text-align:center;padding:50px;">Cargando vista general optimizada...</div>');
  
  datosConsultados = null;
  datosPaginados = null;
  
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  
  setTimeout(() => {
    loadSampledData(SERVER_URL).then(data => {
      const sensor1Data = data.map(record => ({
        x: record.fechaa,
        y: record.sensor1
      }));
      
      if (sensor1Data.length === 0) {
        $('#myPlot').html('<div style="text-align:center;padding:50px;">No hay datos</div>');
        return;
      }
      
      const traces = [{
        x: sensor1Data.map(d => d.x),
        y: sensor1Data.map(d => d.y),
        type: 'scattergl',
        mode: 'lines+markers',
        marker: { size: 2 },
        name: 'Sensor 1',
        hovertemplate: '%{x|%d/%m/%Y, %I:%M:%S %p}<br>%{y} mm<extra></extra>'
      }];
      
      datosConsultados = sensor1Data;
      Plotly.purge('myPlot');
      
      Plotly.newPlot('myPlot', traces, {
        title: 'Vista General Optimizada - Historial Completo',
        xaxis: { title: 'Fecha' },
        yaxis: { title: 'Valores (mm)' },
        autosize: true,
        margin: { l: 50, r: 20, t: 50, b: 50 }
      }, { responsive: true, displayModeBar: false });
      
      $('#paginacionControles').show();
      
    }).catch(error => {
      console.error('Error:', error);
      $('#myPlot').html('<div style="text-align:center;padding:50px;color:red;">Error cargando datos</div>');
    });
  }, 100);
}

// Función para cargar datos con saltos
async function loadSampledData(SERVER_URL) {
  const sampledData = [];
  const limit = 500;
  let offset = 0;
  let totalRecords = 0;
  let skipFactor = 1;
  
  try {
    const firstResponse = await fetch(`${SERVER_URL}/api/data-info`);
    const info = await firstResponse.json();
    totalRecords = info.total || 10000;
    
    if (totalRecords > 1000000) skipFactor = 500;
    else if (totalRecords > 500000) skipFactor = 200;
    else if (totalRecords > 100000) skipFactor = 100;
    else if (totalRecords > 50000) skipFactor = 50;
    else if (totalRecords > 20000) skipFactor = 20;
    else if (totalRecords > 10000) skipFactor = 10;
    else skipFactor = 5;
    
    console.log(`Total: ${totalRecords}, Salto: ${skipFactor}`);
  } catch (error) {
    console.error('Error obteniendo info:', error);
  }
  
  while (offset < totalRecords) {
    try {
      const response = await fetch(`${SERVER_URL}/api/latest-data?limit=${limit}&offset=${offset}`);
      if (!response.ok) break;
      
      const chunk = await response.json();
      if (chunk.length === 0) break;
      
      for (let i = 0; i < chunk.length; i += skipFactor) {
        sampledData.push(chunk[i]);
      }
      
      offset += limit * skipFactor;
      
      $('#myPlot').html(`<div style="text-align:center;padding:50px;">📈 Generando vista optimizada...<br><strong>${sampledData.length.toLocaleString()}</strong> puntos</div>`);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (chunk.length < limit) break;
      
    } catch (error) {
      console.error('Error cargando chunk:', error);
      break;
    }
  }
  
  return sampledData;
}

// Función de actualización en tiempo real
function actualizarDatosEnTiempoReal() {
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  
  fetch(`${SERVER_URL}/api/last-record`)
    .then(response => {
      if (!response.ok) throw new Error('Error en la API');
      return response.json();
    })
    .then(ultimoDato => {
      if (!ultimoDato) return;
      
      const fecha = new Date(ultimoDato.fechaa);
      const fechaStr = fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const horaStr = fecha.toLocaleTimeString('es-ES', { hour12: true });
      
      $('#NivelAguaUltrasonico').text(ultimoDato.sensor1 + ' mm');
      $('#datestring').text(fechaStr);
      $('#timestring').text(horaStr);
      
      console.log('Datos actualizados:', ultimoDato.sensor1 + ' mm');
    })
    .catch(error => {
      console.error('Error actualizando datos:', error);
      $('#NivelAguaUltrasonico').text('Error');
      $('#datestring').text('Error cargando');
      $('#timestring').text('Error');
    });
}

// Funciones de paginación
function paginarPor(periodo) {
  if (!datosConsultados || datosConsultados.length === 0) {
    $('#myPlot').html('<div style="text-align:center;padding:50px;">Cargando todos los datos para ' + periodo + '...</div>');
    cargarTodosLosDatos().then(() => {
      procesarPaginacion(periodo);
    });
    return;
  }
  
  procesarPaginacion(periodo);
}

async function cargarTodosLosDatos() {
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  const allData = [];
  const limit = 1000;
  let offset = 0;
  
  while (true) {
    try {
      const response = await fetch(`${SERVER_URL}/api/latest-data?limit=${limit}&offset=${offset}`);
      if (!response.ok) break;
      
      const chunk = await response.json();
      if (chunk.length === 0) break;
      
      chunk.forEach(record => {
        allData.push({ x: record.fechaa, y: record.sensor1 });
      });
      
      offset += chunk.length;
      
      $('#myPlot').html(`<div style="text-align:center;padding:50px;">Cargando datos completos...<br><strong>${allData.length.toLocaleString()}</strong> registros</div>`);
      
      if (chunk.length < limit) break;
      
    } catch (error) {
      console.error('Error:', error);
      break;
    }
  }
  
  datosConsultados = allData;
  console.log(`Datos completos cargados: ${allData.length}`);
}

function procesarPaginacion(periodo) {
  tipoPaginacion = periodo;
  paginaActual = 0;
  
  // Para semanas y meses, usar búsqueda rápida
  if (periodo === 'semanas') {
    procesarSemanas();
    return;
  }
  
  if (periodo === 'meses') {
    procesarMeses();
    return;
  }
  
  const datos = new Map();
  
  datosConsultados.forEach(record => {
    const fecha = new Date(record.x);
    let clave;
    
    switch(periodo) {
      case 'dias':
        clave = fecha.toISOString().split('T')[0];
        break;
      case 'meses':
        clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'años':
        clave = fecha.getFullYear().toString();
        break;
    }
    
    if (!datos.has(clave)) datos.set(clave, []);
    datos.get(clave).push(record);
  });
  
  datosPaginados = Array.from(datos.keys()).sort().map(clave => datos.get(clave));
  mostrarPagina();
}

// Función optimizada para procesar semanas (carga bajo demanda)
async function procesarSemanas() {
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  
  try {
    const response = await fetch(`${SERVER_URL}/api/data-info`);
    const info = await response.json();
    
    if (!info.firstDate || !info.lastDate) {
      $('#myPlot').html('<div style="text-align:center;padding:50px;">No se pudo obtener rango de fechas</div>');
      return;
    }
    
    const primeraFecha = new Date(info.firstDate);
    const ultimaFecha = new Date(info.lastDate);
    
    // Generar TODAS las semanas pero sin datos
    const semanas = [];
    let inicioSemana = new Date(primeraFecha);
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    
    while (inicioSemana <= ultimaFecha) {
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6);
      
      semanas.push({
        inicio: inicioSemana.toISOString().split('T')[0],
        fin: finSemana.toISOString().split('T')[0],
        display: `Semana del ${inicioSemana.getDate()} al ${finSemana.getDate()} de ${finSemana.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
        loaded: false, // Marcar como no cargada
        data: [],
        count: 0
      });
      
      inicioSemana = new Date(finSemana);
      inicioSemana.setDate(finSemana.getDate() + 1);
    }
    
    // Inicializar datosPaginados con estructura vacía
    datosPaginados = semanas;
    
    // Cargar SOLO la primera semana
    $('#myPlot').html('<div style="text-align:center;padding:50px;">Cargando primera semana...</div>');
    await cargarSemana(0);
    
    mostrarPaginaSemana();
    
  } catch (error) {
    console.error('Error procesando semanas:', error);
    $('#myPlot').html('<div style="text-align:center;padding:50px;color:red;">Error procesando semanas</div>');
  }
}

// Función optimizada para procesar meses
async function procesarMeses() {
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  
  try {
    const response = await fetch(`${SERVER_URL}/api/data-info`);
    const info = await response.json();
    
    if (!info.firstDate || !info.lastDate) {
      $('#myPlot').html('<div style="text-align:center;padding:50px;">No se pudo obtener rango de fechas</div>');
      return;
    }
    
    const primeraFecha = new Date(info.firstDate);
    const ultimaFecha = new Date(info.lastDate);
    
    // Generar TODOS los meses pero sin datos
    const meses = [];
    let fechaActual = new Date(primeraFecha.getFullYear(), primeraFecha.getMonth(), 1);
    
    while (fechaActual <= ultimaFecha) {
      const year = fechaActual.getFullYear();
      const month = fechaActual.getMonth() + 1;
      const monthStr = String(month).padStart(2, '0');
      
      meses.push({
        year: year,
        month: monthStr,
        display: fechaActual.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }),
        loaded: false,
        data: [],
        count: 0
      });
      
      fechaActual.setMonth(fechaActual.getMonth() + 1);
    }
    
    datosPaginados = meses;
    
    // Cargar SOLO el primer mes
    $('#myPlot').html('<div style="text-align:center;padding:50px;">Cargando primer mes...</div>');
    await cargarMes(0);
    
    mostrarPaginaMes();
    
  } catch (error) {
    console.error('Error procesando meses:', error);
    $('#myPlot').html('<div style="text-align:center;padding:50px;color:red;">Error procesando meses</div>');
  }
}

// Función para cargar una semana específica
async function cargarSemana(indice) {
  if (!datosPaginados[indice] || datosPaginados[indice].loaded) {
    return;
  }
  
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  const semana = datosPaginados[indice];
  
  try {
    const response = await fetch(`${SERVER_URL}/api/week-data?startDate=${semana.inicio}&endDate=${semana.fin}`);
    if (response.ok) {
      const weekData = await response.json();
      const formattedData = weekData.map(record => ({
        x: record.fechaa,
        y: record.sensor1
      }));
      
      datosPaginados[indice].data = formattedData;
      datosPaginados[indice].count = formattedData.length;
      datosPaginados[indice].loaded = true;
      
      console.log(`Semana ${indice + 1} cargada: ${formattedData.length} registros`);
    }
  } catch (error) {
    console.error(`Error cargando semana ${indice}:`, error);
  }
}

// Función para cargar un mes específico
async function cargarMes(indice) {
  if (!datosPaginados[indice] || datosPaginados[indice].loaded) {
    return;
  }
  
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  const mes = datosPaginados[indice];
  
  try {
    const response = await fetch(`${SERVER_URL}/api/month-data?year=${mes.year}&month=${mes.month}`);
    if (response.ok) {
      const monthData = await response.json();
      const formattedData = monthData.map(record => ({
        x: record.fechaa,
        y: record.sensor1
      }));
      
      datosPaginados[indice].data = formattedData;
      datosPaginados[indice].count = formattedData.length;
      datosPaginados[indice].loaded = true;
      
      console.log(`Mes ${indice + 1} cargado: ${formattedData.length} registros (resolución reducida)`);
    }
  } catch (error) {
    console.error(`Error cargando mes ${indice}:`, error);
  }
}

function mostrarPagina() {
  if (tipoPaginacion === 'semanas') {
    mostrarPaginaSemana();
    return;
  }
  
  if (tipoPaginacion === 'meses') {
    mostrarPaginaMes();
    return;
  }
  
  if (!datosPaginados || datosPaginados.length === 0) return;
  
  const datosActuales = datosPaginados[paginaActual] || [];
  
  Plotly.purge('myPlot');
  
  Plotly.newPlot('myPlot', [{
    x: datosActuales.map(d => d.x),
    y: datosActuales.map(d => d.y),
    type: 'scattergl',
    mode: 'lines+markers',
    marker: { size: 2 },
    name: 'Sensor 1',
    hovertemplate: '%{x|%d/%m/%Y, %I:%M:%S %p}<br>%{y} mm<extra></extra>'
  }], {
    title: `${tipoPaginacion.charAt(0).toUpperCase() + tipoPaginacion.slice(1)} - Página ${paginaActual + 1}`,
    xaxis: { title: 'Fecha' },
    yaxis: { title: 'Valores (mm)' },
    autosize: true,
    margin: { l: 50, r: 20, t: 50, b: 50 }
  }, { responsive: true, displayModeBar: false });
  
  $('#paginaInfo').text(`Página ${paginaActual + 1} de ${datosPaginados.length}`);
  
  $('button[onclick="anteriorPagina()"]').prop('disabled', paginaActual === 0);
  $('button[onclick="siguientePagina()"]').prop('disabled', paginaActual >= datosPaginados.length - 1);
}

async function mostrarPaginaSemana() {
  if (!datosPaginados || datosPaginados.length === 0) return;
  
  const semanaActual = datosPaginados[paginaActual];
  if (!semanaActual) return;
  
  // Si la semana no está cargada, cargarla
  if (!semanaActual.loaded) {
    $('#myPlot').html(`<div style="text-align:center;padding:50px;">Cargando ${semanaActual.display}...</div>`);
    await cargarSemana(paginaActual);
  }
  
  Plotly.purge('myPlot');
  
  Plotly.newPlot('myPlot', [{
    x: semanaActual.data.map(d => d.x),
    y: semanaActual.data.map(d => d.y),
    type: 'scattergl',
    mode: 'lines+markers',
    marker: { size: 2 },
    name: 'Sensor 1',
    hovertemplate: '%{x|%d/%m/%Y, %I:%M:%S %p}<br>%{y} mm<extra></extra>'
  }], {
    title: `${semanaActual.display} (${semanaActual.count} registros)`,
    xaxis: { title: 'Fecha' },
    yaxis: { title: 'Valores (mm)' },
    autosize: true,
    margin: { l: 50, r: 20, t: 50, b: 50 }
  }, { responsive: true, displayModeBar: false });
  
  $('#paginaInfo').text(`${semanaActual.display} (${paginaActual + 1}/${datosPaginados.length})`);
  
  $('button[onclick="anteriorPagina()"]').prop('disabled', paginaActual === 0);
  $('button[onclick="siguientePagina()"]').prop('disabled', paginaActual >= datosPaginados.length - 1);
}

async function mostrarPaginaMes() {
  if (!datosPaginados || datosPaginados.length === 0) return;
  
  const mesActual = datosPaginados[paginaActual];
  if (!mesActual) return;
  
  // Si el mes no está cargado, cargarlo
  if (!mesActual.loaded) {
    $('#myPlot').html(`<div style="text-align:center;padding:50px;">Cargando ${mesActual.display}...</div>`);
    await cargarMes(paginaActual);
  }
  
  Plotly.purge('myPlot');
  
  Plotly.newPlot('myPlot', [{
    x: mesActual.data.map(d => d.x),
    y: mesActual.data.map(d => d.y),
    type: 'scattergl',
    mode: 'lines+markers',
    marker: { size: 2 },
    name: 'Sensor 1',
    hovertemplate: '%{x|%d/%m/%Y, %I:%M:%S %p}<br>%{y} mm<extra></extra>'
  }], {
    title: `${mesActual.display} (${mesActual.count} registros - resolución reducida)`,
    xaxis: { title: 'Fecha' },
    yaxis: { title: 'Valores (mm)' },
    autosize: true,
    margin: { l: 50, r: 20, t: 50, b: 50 }
  }, { responsive: true, displayModeBar: false });
  
  $('#paginaInfo').text(`${mesActual.display} (${paginaActual + 1}/${datosPaginados.length})`);
  
  $('button[onclick="anteriorPagina()"]').prop('disabled', paginaActual === 0);
  $('button[onclick="siguientePagina()"]').prop('disabled', paginaActual >= datosPaginados.length - 1);
}

function anteriorPagina() {
  if (datosPaginados && paginaActual > 0) {
    paginaActual--;
    mostrarPagina();
  }
}

function siguientePagina() {
  if (datosPaginados && paginaActual < datosPaginados.length - 1) {
    paginaActual++;
    mostrarPagina();
  }
}

// Inicialización
$(document).ready(function() {
  $('#myPlot').empty();
  actualizarDatosEnTiempoReal();
  setInterval(actualizarDatosEnTiempoReal, 5000);
  console.log('Página cargada - Sistema iniciado');
});