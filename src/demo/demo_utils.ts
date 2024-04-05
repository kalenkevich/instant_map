export function createRootEl(
  width: number = window.innerWidth,
  height: number = window.innerHeight,
  margin: number = 0,
) {
  width -= margin;
  height -= margin;

  const div = document.createElement('div');

  div.id = 'glide-gl';
  div.style.margin = `${margin / 2}px`;
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
  div.style.position = `relative`;
  div.style.overflow = 'hidden';
  document.body.appendChild(div);

  return div;
}
