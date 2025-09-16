function consultarDatos() {
  console.log('Iniciando consultarDatos...');
  $('#myPlot').html('<div style="text-align:center;padding:50px;">Cargando vista general optimizada...</div>');
  
  // Liberar memoria anterior
  datosConsultados = null;
  datosPaginados = null;
  
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  
  setTimeout(() => {
    // Cargar datos con SALTOS para optimizar memoria
    const loadSampledData = async () => {
      const sampledData = [];
      const limit = 500;
      let offset = 0;
      let totalRecords = 0;
      let skipFactor = 1;
      
      // Primer request para estimar total
      try {
        console.log('Obteniendo info de datos desde:', `${SERVER_URL}/api/data-info`);
        const firstResponse = await fetch(`${SERVER_URL}/api/data-info`);
        const info = await firstResponse.json();
        totalRecords = info.total || 10000;
        console.log('Total de registros:', totalRecords);
        
        // Calcular factor de salto para millones de registros
        if (totalRecords > 1000000) skipFactor = 500;      // 1M+ → cada 500
        else if (totalRecords > 500000) skipFactor = 200;   // 500K+ → cada 200
        else if (totalRecords > 100000) skipFactor = 100;   // 100K+ → cada 100
        else if (totalRecords > 50000) skipFactor = 50;     // 50K+ → cada 50
        else if (totalRecords > 20000) skipFactor = 20;     // 20K+ → cada 20
        else if (totalRecords > 10000) skipFactor = 10;     // 10K+ → cada 10
        else skipFactor = 5;                                // Menos → cada 5
        
        console.log(`📊 Total estimado: ${totalRecords}, Factor de salto: ${skipFactor}`);
      } catch (error) {
        console.error('Error obteniendo info:', error);
      }
      
      while (offset < totalRecords) {
        try {
          const response = await fetch(`${SERVER_URL}/api/latest-data?limit=${limit}&offset=${offset}`);
          if (!response.ok) break;
          
          const chunk = await response.json();
          if (chunk.length === 0) break;
          
          // Tomar solo algunos registros del chunk (saltos)
          for (let i = 0; i < chunk.length; i += skipFactor) {
            sampledData.push(chunk[i]);
          }
          
          offset += limit * skipFactor;
          
          // Mostrar progreso
          $('#myPlot').html(`<div style="text-align:center;padding:50px;">📈 Generando vista optimizada...<br><strong>${sampledData.length.toLocaleString()}</strong> puntos de datos<br><small>Saltando cada ${skipFactor} registros</small></div>`);
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (chunk.length < limit) break;
          
        } catch (error) {
          console.error('Error cargando chunk:', error);
          break;
        }
      }
      
      console.log(`✅ Vista optimizada: ${sampledData.length} de ${totalRecords} registros`);
      return sampledData;
    };
    
    loadSampledData().then(data => {
      const sensor1Data = [];
      const sensor2Data = [];
      const sensor3Data = [];
      
      console.log(`Datos optimizados cargados: ${data.length}`);
      
      // Sin filtro de fechas - mostrar todos los datos muestreados
      data.forEach(record => {
        sensor1Data.push({ x: record.fechaa, y: record.sensor1 });
        if (record.sensor2) sensor2Data.push({ x: record.fechaa, y: record.sensor2 });
        if (record.sensor3) sensor3Data.push({ x: record.fechaa, y: record.sensor3 });
      });
      
      console.log(`Puntos en gráfica: ${sensor1Data.length}`);
        
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
        
        if (sensor2Data.length > 0) {
          traces.push({
            x: sensor2Data.map(d => d.x),
            y: sensor2Data.map(d => d.y),
            type: 'scattergl',
            mode: 'lines+markers',
            marker: { size: 2 },
            name: 'Sensor 2',
            hovertemplate: '%{x|%d/%m/%Y, %I:%M:%S %p}<br>%{y} mm<extra></extra>'
          });
        }
        
        if (sensor3Data.length > 0) {
          traces.push({
            x: sensor3Data.map(d => d.x),
            y: sensor3Data.map(d => d.y),
            type: 'scattergl',
            mode: 'lines+markers',
            marker: { size: 2 },
            name: 'Sensor 3',
            hovertemplate: '%{x|%d/%m/%Y, %I:%M:%S %p}<br>%{y} mm<extra></extra>'
          });
        }
        
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
        
        window.addEventListener('resize', function() {
          Plotly.Plots.resize('myPlot');
        });
      })
      .catch((error) => {
        console.error('Error en consultarDatos:', error);
        $('#myPlot').html('<div style="text-align:center;padding:50px;color:red;">Error cargando datos</div>');
      });
  }, 100);
}

// Función original simplificada para compatibilidad
function consultarDatosOriginal() {
  const fechaInicio = $('#startdate').val();
  const fechaFin = $('#enddate').val();
  
  if (!fechaInicio || !fechaFin) {
    alert('Por favor selecciona ambas fechas');
    return;
  }
  
  $('#myPlot').html('<div style="text-align:center;padding:50px;">Cargando datos...</div>');
  
  const inicio = new Date(fechaInicio.split('/').reverse().join('-'));
  const fin = new Date(fechaFin.split('/').reverse().join('-'));
  
  datosConsultados = null;
  datosPaginados = null;
  $('#paginacionControles').hide();
  
  setTimeout(() => {
    fetch('firebase-cache.jsonl')
      .then(response => {
        if (!response.ok) throw new Error('Archivo no encontrado');
        return response.body.getReader();
      })
      .then(reader => {
        let buffer = '';
        const sensor1Data = [];
        const sensor2Data = [];
        const sensor3Data = [];
        let lineCount = 0;
        
        function processChunk() {
          return reader.read().then(({ done, value }) => {
            if (done) {
              // Procesar último chunk
              if (buffer.trim()) {
                processLines(buffer.split('\n'), sensor1Data, sensor2Data, sensor3Data, inicio, fin);
              }
              return { sensor1Data, sensor2Data, sensor3Data };
            }
            
            buffer += new TextDecoder().decode(value);
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Guardar línea incompleta
            
            // Procesar solo cada 10ma línea para optimizar
            const linesToProcess = lines.filter((_, i) => i % 10 === 0);
            processLines(linesToProcess, sensor1Data, sensor2Data, sensor3Data, inicio, fin);
            
            lineCount += lines.length;
            if (lineCount % 1000 === 0) {
              $('#myPlot').html(`<div style="text-align:center;padding:50px;">Procesando... ${lineCount} líneas</div>`);
            }
            
            return processChunk();
          });
        }
        
        return processChunk();
      })
      .then(({ sensor1Data, sensor2Data, sensor3Data }) => {
        
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
        
        if (sensor2Data.length > 0) {
          traces.push({
            x: sensor2Data.map(d => d.x),
            y: sensor2Data.map(d => d.y),
            type: 'scattergl',
            mode: 'lines+markers',
            marker: { size: 2 },
            name: 'Sensor 2',
            hovertemplate: '%{x|%d/%m/%Y, %I:%M:%S %p}<br>%{y} mm<extra></extra>'
          });
        }
        
        if (sensor3Data.length > 0) {
          traces.push({
            x: sensor3Data.map(d => d.x),
            y: sensor3Data.map(d => d.y),
            type: 'scattergl',
            mode: 'lines+markers',
            marker: { size: 2 },
            name: 'Sensor 3',
            hovertemplate: '%{x|%d/%m/%Y, %I:%M:%S %p}<br>%{y} mm<extra></extra>'
          });
        }
        
        // Guardar datos para paginación
        datosConsultados = sensor1Data;
        
        // Limpiar gráfica anterior para liberar memoria
        Plotly.purge('myPlot');
        
        Plotly.newPlot('myPlot', traces, {
          title: 'Historial de Datos - Múltiples Sensores',
          xaxis: { title: 'Fecha' },
          yaxis: { title: 'Valores (mm)' },
          autosize: true,
          margin: { l: 50, r: 20, t: 50, b: 50 }
        }, { responsive: true, displayModeBar: false });
        
        // Mostrar controles de paginación
        $('#paginacionControles').show();
        
        window.addEventListener('resize', function() {
          Plotly.Plots.resize('myPlot');
        });
      })
      .catch(() => {
        $('#myPlot').html('<div style="text-align:center;padding:50px;color:red;">Error</div>');
      });
  }, 100);
}

function actualizarDatosEnTiempoReal() {
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  
  console.log('Actualizando datos en tiempo real...');
  
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
      
      console.log('Datos actualizados:', ultimoDato.sensor1 + ' mm', fechaStr);
    })
    .catch(error => {
      console.error('Error actualizando datos:', error);
      $('#NivelAguaUltrasonico').text('Error');
      $('#datestring').text('Error cargando');
      $('#timestring').text('Error');
    });
}

// Función para múltiples consultas
function consultasMultiples() {
  const consultas = [
    { inicio: '01/01/2024', fin: '31/01/2024', sensor: 'sensor1' },
    { inicio: '01/02/2024', fin: '28/02/2024', sensor: 'sensor1' },
    { inicio: '01/03/2024', fin: '31/03/2024', sensor: 'sensor1' }
  ];
  
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  const resultados = [];
  
  consultas.forEach((consulta, index) => {
    fetch(`${SERVER_URL}/api/latest-data`)
      .then(response => {
        if (!response.ok) throw new Error('Archivo no encontrado');
        return response.text();
      })
      .then(text => {
        if (text.includes('</html>')) throw new Error('Respuesta HTML en lugar de JSON');
        const lines = text.trim().split('\n');
        const data = [];
        const inicio = new Date(consulta.inicio.split('/').reverse().join('-'));
        const fin = new Date(consulta.fin.split('/').reverse().join('-'));
        
        for (let i = 0; i < lines.length; i += 10) {
          if (!lines[i] || !lines[i].trim()) continue;
          
          try {
            const record = JSON.parse(lines[i]);
            const fecha = new Date(record.fechaa);
            
            if (fecha >= inicio && fecha <= fin) {
              data.push({ x: record.fechaa, y: record[consulta.sensor] });
            }
          } catch (e) {}
        }
        
        resultados[index] = {
          name: `${consulta.sensor} (${consulta.inicio} - ${consulta.fin})`,
          x: data.map(d => d.x),
          y: data.map(d => d.y),
          type: 'scatter',
          mode: 'lines'
        };
        
        if (resultados.filter(r => r).length === consultas.length) {
          $('#myPlot').empty();
          Plotly.newPlot('myPlot', resultados, {
            title: 'Múltiples Consultas',
            xaxis: { title: 'Fecha' },
            yaxis: { title: 'Valores (mm)' },
            autosize: true,
            margin: { l: 50, r: 20, t: 50, b: 50 }
          }, { responsive: true });
        }
      });
  });
}

let datosConsultados = [];
let paginaActual = 0;
let tipoPaginacion = 'dias';
let datosPaginados = [];

function processLines(lines, sensor1Data, sensor2Data, sensor3Data, inicio, fin) {
  for (const line of lines) {
    if (!line || !line.trim()) continue;
    
    try {
      const record = JSON.parse(line);
      const fecha = new Date(record.fechaa);
      
      if (fecha >= inicio && fecha <= fin) {
        sensor1Data.push({ x: record.fechaa, y: record.sensor1 });
        if (record.sensor2) sensor2Data.push({ x: record.fechaa, y: record.sensor2 });
        if (record.sensor3) sensor3Data.push({ x: record.fechaa, y: record.sensor3 });
      }
    } catch (e) {}
  }
}

function paginarPor(periodo) {
  if (!datosConsultados || datosConsultados.length === 0) {
    // Si no hay datos consultados, cargar todos los datos sin saltos
    $('#myPlot').html('<div style="text-align:center;padding:50px;">Cargando todos los datos para ' + periodo + '...</div>');
    cargarTodosLosDatos().then(() => {
      procesarPaginacion(periodo);
    });
    return;
  }
  
  procesarPaginacion(periodo);
}

// Función para cargar TODOS los datos sin saltos
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
      
      // Agregar TODOS los datos sin saltos
      chunk.forEach(record => {
        allData.push({ x: record.fechaa, y: record.sensor1 });
      });
      
      offset += chunk.length;
      
      // Mostrar progreso
      $('#myPlot').html(`<div style="text-align:center;padding:50px;">Cargando datos completos...<br><strong>${allData.length.toLocaleString()}</strong> registros</div>`);
      
      if (chunk.length < limit) break;
      
    } catch (error) {
      console.error('Error:', error);
      break;
    }
  }
  
  datosConsultados = allData;
  console.log(`✅ Datos completos cargados: ${allData.length}`);
}

function procesarPaginacion(periodo) {
  tipoPaginacion = periodo;
  paginaActual = 0;
  
  // Para semanas, usar búsqueda rápida
  if (periodo === 'semanas') {
    procesarSemanas();
    return;
  }
  
  // Liberar memoria anterior
  datosPaginados = null;
  
  const datos = new Map();
  
  // Procesar en chunks para evitar bloquear UI
  const chunkSize = 1000;
  let index = 0;
  
  function processChunk() {
    const end = Math.min(index + chunkSize, datosConsultados.length);
    
    for (let i = index; i < end; i++) {
      const record = datosConsultados[i];
      const fecha = new Date(record.x);
      let clave;
      
      switch(periodo) {
        case 'dias':
          clave = fecha.toISOString().split('T')[0];
          break;
        case 'semanas':
          const semana = new Date(fecha);
          semana.setDate(fecha.getDate() - fecha.getDay());
          clave = semana.toISOString().split('T')[0];
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
    }
    
    index = end;
    
    if (index < datosConsultados.length) {
      setTimeout(processChunk, 0); // No bloquear UI
    } else {
      datosPaginados = Array.from(datos.keys()).sort().map(clave => datos.get(clave));
      mostrarPagina();
    }
  }
  
  processChunk();
}

// Función optimizada para procesar semanas
async function procesarSemanas() {
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  
  if (!datosConsultados || datosConsultados.length === 0) {
    $('#myPlot').html('<div style="text-align:center;padding:50px;">No hay datos para procesar</div>');
    return;
  }
  
  // Obtener rango de fechas de los datos
  const fechas = datosConsultados.map(d => new Date(d.x)).sort((a, b) => a - b);
  const primeraFecha = fechas[0];
  const ultimaFecha = fechas[fechas.length - 1];
  
  // Generar semanas
  const semanas = [];
  let inicioSemana = new Date(primeraFecha);
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay()); // Lunes
  
  while (inicioSemana <= ultimaFecha) {
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6); // Domingo
    
    semanas.push({
      inicio: inicioSemana.toISOString().split('T')[0],
      fin: finSemana.toISOString().split('T')[0],
      display: `Semana del ${inicioSemana.getDate()} al ${finSemana.getDate()} de ${finSemana.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
    });
    
    inicioSemana = new Date(finSemana);
    inicioSemana.setDate(finSemana.getDate() + 1);
  }
  
  // Cargar datos de cada semana usando API rápida
  datosPaginados = [];
  
  for (let i = 0; i < semanas.length; i++) {
    const semana = semanas[i];
    
    try {
      const response = await fetch(`${SERVER_URL}/api/week-data?startDate=${semana.inicio}&endDate=${semana.fin}`);
      if (response.ok) {
        const weekData = await response.json();
        const formattedData = weekData.map(record => ({
          x: record.fechaa,
          y: record.sensor1
        }));
        
        datosPaginados.push({
          data: formattedData,
          title: semana.display,
          count: formattedData.length
        });
      }
    } catch (error) {
      console.error('Error cargando semana:', error);
    }
    
    // Mostrar progreso
    $('#myPlot').html(`<div style="text-align:center;padding:50px;">Procesando semanas...<br>${i + 1} de ${semanas.length}</div>`);
  }
  
  mostrarPaginaSemana();
}

function mostrarPagina() {
  if (tipoPaginacion === 'semanas') {
    mostrarPaginaSemana();
    return;
  }
  
  if (!datosPaginados || datosPaginados.length === 0) return;
  
  const datosActuales = datosPaginados[paginaActual] || [];
  
  $('#myPlot').empty();
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
  
  // Mostrar información específica del período
  let infoTexto = '';
  if (datosPaginados.length > 0 && datosPaginados[paginaActual].length > 0) {
    const fechaEjemplo = new Date(datosPaginados[paginaActual][0].x);
    
    switch(tipoPaginacion) {
      case 'dias':
        infoTexto = fechaEjemplo.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        break;
      case 'meses':
        infoTexto = fechaEjemplo.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        break;
      case 'años':
        infoTexto = fechaEjemplo.getFullYear().toString();
        break;
    }
  }
  
  $('#paginaInfo').text(`${infoTexto} (${paginaActual + 1}/${datosPaginados.length})`);
  
  // Actualizar estado de botones
  $('button[onclick="anteriorPagina()"]').prop('disabled', paginaActual === 0);
  $('button[onclick="siguientePagina()"]').prop('disabled', paginaActual >= datosPaginados.length - 1);
}

function mostrarPaginaSemana() {
  if (!datosPaginados || datosPaginados.length === 0) return;
  
  const semanaActual = datosPaginados[paginaActual];
  if (!semanaActual) return;
  
  $('#myPlot').empty();
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
    title: `${semanaActual.title} (${semanaActual.count} registros)`,
    xaxis: { title: 'Fecha' },
    yaxis: { title: 'Valores (mm)' },
    autosize: true,
    margin: { l: 50, r: 20, t: 50, b: 50 }
  }, { responsive: true, displayModeBar: false });
  
  $('#paginaInfo').text(`${semanaActual.title} (${paginaActual + 1}/${datosPaginados.length})`);
  
  // Actualizar estado de botones
  $('button[onclick="anteriorPagina()"]').prop('disabled', paginaActual === 0);
  $('button[onclick="siguientePagina()"]').prop('disabled', paginaActual >= datosPaginados.length - 1);
}
  
  // Mostrar información específica del período
  let infoTexto = '';
  if (datosPaginados.length > 0 && datosPaginados[paginaActual].length > 0) {
    const fechaEjemplo = new Date(datosPaginados[paginaActual][0].x);
    
    switch(tipoPaginacion) {
      case 'dias':
        infoTexto = fechaEjemplo.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        break;
      case 'semanas':
        const inicioSemana = new Date(fechaEjemplo);
        inicioSemana.setDate(fechaEjemplo.getDate() - fechaEjemplo.getDay());
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);
        infoTexto = `Semana del ${inicioSemana.getDate()} al ${finSemana.getDate()} de ${finSemana.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
        break;
      case 'meses':
        infoTexto = fechaEjemplo.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        break;
      case 'años':
        infoTexto = fechaEjemplo.getFullYear().toString();
        break;
    }
  }
  
  $('#paginaInfo').text(`${infoTexto} (${paginaActual + 1}/${datosPaginados.length})`);
  
  // Actualizar estado de botones
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

// Iniciar actualización automática cuando carga la página
$(document).ready(function() {
  $('#myPlot').empty(); // Limpiar contenedor de gráfica
  
  // Iniciar actualización de tabla en tiempo real
  actualizarDatosEnTiempoReal();
  setInterval(actualizarDatosEnTiempoReal, 5000); // Actualizar cada 5 segundos
  
  console.log('Página cargada - Iniciando actualización en tiempo real');
});