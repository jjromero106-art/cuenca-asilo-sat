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
  
  // Usar búsqueda rápida optimizada
  const fechaISO = inicio.toISOString().split('T')[0]; // YYYY-MM-DD
  
  fetch(`${SERVER_URL}/api/day-data?date=${fechaISO}`)
    .then(response => {
      if (!response.ok) throw new Error('Error en la API');
      return response.json();
    })
    .then(dayRecords => {
      const sensor1Data = dayRecords.map(record => ({
        x: record.fechaa,
        y: record.sensor1
      }));
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
        title: `Datos del ${inicio.toLocaleDateString('es-ES')} (${sensor1Data.length} registros)`,
        xaxis: { title: 'Hora' },
        yaxis: { 
          title: 'Nivel de Agua (mm)',
          ticksuffix: ' mm'
        },
        autosize: true,
        margin: { l: 60, r: 20, t: 50, b: 50 }
      }, { responsive: true, displayModeBar: true });
      
    }).catch(error => {
      console.error('Error:', error);
      $('#myPlot').html('<div style="text-align:center;padding:50px;color:red;">Error cargando datos del día</div>');
    });
}

// Función para cargar datos de un día específico
async function loadDayData(inicio, fin) {
  const SERVER_URL = 'https://cuenca-asilo-backend.onrender.com';
  const allData = [];
  const limit = 1000;
  let offset = 0;
  let totalProcessed = 0;
  const maxRecords = 100000; // Límite para evitar bucle infinito
  
  while (totalProcessed < maxRecords) {
    try {
      const response = await fetch(`${SERVER_URL}/api/latest-data?limit=${limit}&offset=${offset}`);
      if (!response.ok) {
        console.log('Response not OK:', response.status);
        break;
      }
      
      const chunk = await response.json();
      if (chunk.length === 0) {
        console.log('No more data available');
        break;
      }
      
      // Filtrar datos del día
      chunk.forEach(record => {
        const fecha = new Date(record.fechaa);
        if (fecha >= inicio && fecha <= fin) {
          allData.push({ x: record.fechaa, y: record.sensor1 });
        }
      });
      
      totalProcessed += chunk.length;
      offset += chunk.length;
      
      // Mostrar progreso
      $('#myPlot').html(`<div style="text-align:center;padding:50px;">Buscando datos del día...<br><strong>${allData.length}</strong> registros encontrados<br><small>Procesados: ${totalProcessed.toLocaleString()}</small></div>`);
      
      // Salir si el chunk es menor al límite (no hay más datos)
      if (chunk.length < limit) {
        console.log('Last chunk received, ending search');
        break;
      }
      
      // Pausa pequeña para no bloquear UI
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error('Error loading day data:', error);
      break;
    }
  }
  
  console.log(`Búsqueda completada. Encontrados: ${allData.length} registros del día`);
  return allData;
}