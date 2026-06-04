export const CATEGORIAS = [
  { value: '', label: 'Todas las categorías' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'administracion', label: 'Administración' },
  { value: 'construccion', label: 'Construcción' },
  { value: 'gastronomia', label: 'Gastronomía' },
  { value: 'salud', label: 'Salud' },
  { value: 'educacion', label: 'Educación' },
  { value: 'logistica', label: 'Logística' },
  { value: 'diseno', label: 'Diseño' },
  { value: 'atencion_al_cliente', label: 'Atención al Cliente' },
  { value: 'produccion', label: 'Producción' },
  { value: 'otro', label: 'Otros' }
];

export const MODALIDADES = [
  { value: '', label: 'Todas las modalidades' },
  { value: 'remoto', label: 'Remoto' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' }
];

export function labelCategoria(value) {
  const c = CATEGORIAS.find(c => c.value === value);
  return c ? c.label : value;
}

export function tiempoRelativo(fecha) {
  const ahora = Date.now();
  const diff = ahora - new Date(fecha).getTime();
  const segundos = Math.floor(diff / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  if (dias > 0) return `hace ${dias} día${dias > 1 ? 's' : ''}`;
  if (horas > 0) return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
  if (minutos > 0) return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
  return 'hace unos segundos';
}
