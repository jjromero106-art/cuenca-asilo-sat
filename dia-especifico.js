// Función para consultar día específico
function consultarDiaEspecifico() {
  const fechaSeleccionada = $('#fechaEspecifica').val();
  if (!fechaSeleccionada) {
    alert('Por favor selecciona una fecha');
    return;
  }
  
  $('#myPlot').html('<div style="text-align:center;padding:50px;">Cargando día específico...</div>');
  
  // Convertir formato dd/mm/yyyy a Date
  const fechaParts = fechaSeleccionada.split('/');
  const inicio = new Date(fechaParts[2], fechaParts[1] - 1, fechaParts[0]);
  const fin = new Date(fechaParts[2], fechaParts[1] - 1, fechaParts[0]);
  fin.setHours(23, 59, 59, 999);
  
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  
  // Cargar datos del día específico
  loadDayData(inicio, fin).then(sensor1Data => {
    if (sensor1Data.length === 0) {
      $('#myPlot').html('<div style="text-align:center;padding:50px;">No hay datos para esta fecha</div>');
      return;
    }
    
    const traces = [{
      x: sensor1Data.map(d => d.x),
      y: sensor1Data.map(d => d.y),
      type: 'scattergl',
      mode: 'lines+markers',
      marker: { size: 3 },
      name: 'Sensor 1',
      hovertemplate: '%{x|%d/%m/%Y, %I:%M:%S %p}<br>%{y} mm<extra></extra>'
    }];
    
    Plotly.purge('myPlot');
    Plotly.newPlot('myPlot', traces, {
      title: `Datos del ${inicio.toLocaleDateString('es-ES')}`,
      xaxis: { title: 'Hora' },
      yaxis: { title: 'Nivel (mm)' },
      autosize: true,
      margin: { l: 50, r: 20, t: 50, b: 50 }
    }, { responsive: true, displayModeBar: false });
    
  }).catch(error => {
    $('#myPlot').html('<div style="text-align:center;padding:50px;color:red;">Error cargando datos</div>');
  });
}

// Función para cargar datos de un día específico
async function loadDayData(inicio, fin) {
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
      
      // Filtrar datos del día
      chunk.forEach(record => {
        const fecha = new Date(record.fechaa);
        if (fecha >= inicio && fecha <= fin) {
          allData.push({ x: record.fechaa, y: record.sensor1 });
        }
      });
      
      offset += chunk.length;
      
      // Mostrar progreso
      $('#myPlot').html(`<div style="text-align:center;padding:50px;">Buscando datos del día...<br>${allData.length} registros encontrados</div>`);
      
      if (chunk.length < limit) break;
      
    } catch (error) {
      console.error('Error:', error);
      break;
    }
  }
  
  return allData;
}