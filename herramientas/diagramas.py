"""
Dibuja los diagramas de las lecciones como SVG en lecciones/img/.

    python3 herramientas/diagramas.py        # genera los .svg
    node herramientas/a-png.js               # los convierte a .png

Cada diagrama es una función: para corregir uno se edita su función y se
vuelven a correr los dos comandos.
"""
import os

SALIDA = os.path.join(os.path.dirname(__file__), '..', 'lecciones', 'img')
F = 'font-family="DejaVu Sans, Arial, sans-serif"'
TINTA = '#1f2937'
SUAVE = '#4b5563'

# ───────────────────────── piezas ─────────────────────────

def texto(x, y, lineas, tam=13, peso='normal', ancla='middle', color=TINTA):
    if isinstance(lineas, str):
        lineas = [lineas]
    h = tam * 1.25
    y0 = y - (len(lineas) - 1) * h / 2
    ts = ''.join(f'<tspan x="{x}" y="{y0 + i * h:.1f}">{l}</tspan>' for i, l in enumerate(lineas))
    return (f'<text {F} font-size="{tam}" font-weight="{peso}" text-anchor="{ancla}" '
            f'dominant-baseline="middle" fill="{color}">{ts}</text>')

def caja(x, y, w, h, lineas, fondo='#ffffff', borde=TINTA, tam=13, peso='normal', rx=10, grosor=1.6, color=TINTA, guion=None):
    g = f' stroke-dasharray="{guion}"' if guion else ''
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fondo}" stroke="{borde}" stroke-width="{grosor}"{g}/>'
            + (texto(x + w / 2, y + h / 2, lineas, tam, peso, color=color) if lineas else ''))

def flecha(puntos, etiqueta=None, ex=0, ey=-12, color=TINTA, guion=None, tam=11):
    d = 'M' + ' L'.join(f'{x},{y}' for x, y in puntos)
    g = f' stroke-dasharray="{guion}"' if guion else ''
    s = f'<path d="{d}" fill="none" stroke="{color}" stroke-width="1.7" marker-end="url(#punta)"{g}/>'
    if etiqueta:
        (x1, y1), (x2, y2) = puntos[0], puntos[1]
        s += texto((x1 + x2) / 2 + ex, (y1 + y2) / 2 + ey, etiqueta, tam, 'bold', color=SUAVE)
    return s

DEFS = ('<defs><marker id="punta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" '
        'markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker></defs>')

def lienzo(w, h, titulo, subtitulo=None, fondo='#ffffff'):
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">', DEFS,
         f'<rect width="{w}" height="{h}" fill="{fondo}"/>', texto(w / 2, 30, titulo, 20, 'bold')]
    if subtitulo:
        s.append(texto(w / 2, 56, subtitulo, 13, color=SUAVE))
    return s

def guardar(nombre, partes, w, h):
    os.makedirs(SALIDA, exist_ok=True)
    with open(os.path.join(SALIDA, nombre + '.svg'), 'w') as f:
        f.write('\n'.join(partes + ['</svg>']))
    return (nombre, w, h)

# BPMN
def tarea(x, cy, lineas, w=124, h=52, sub=False, resalte=False):
    borde = '#b45309' if resalte else TINTA
    s = (f'<rect x="{x}" y="{cy - h / 2}" width="{w}" height="{h}" rx="10" fill="{"#fff7ed" if resalte else "#ffffff"}" '
         f'stroke="{borde}" stroke-width="{2.6 if resalte else 1.6}"/>' + texto(x + w / 2, cy - (6 if sub else 0), lineas, 12))
    if sub:
        s += (f'<rect x="{x + w / 2 - 7}" y="{cy + h / 2 - 16}" width="14" height="14" fill="#fff" stroke="{borde}" stroke-width="1.3"/>'
              f'<path d="M{x + w / 2 - 4},{cy + h / 2 - 9} L{x + w / 2 + 4},{cy + h / 2 - 9} M{x + w / 2},{cy + h / 2 - 13} L{x + w / 2},{cy + h / 2 - 5}" stroke="{borde}" stroke-width="1.5"/>')
    return s

def inicio(cx, cy, etiqueta=None, abajo=True):
    s = f'<circle cx="{cx}" cy="{cy}" r="16" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>'
    if etiqueta:
        s += texto(cx, cy + 32, etiqueta, 11) if abajo else texto(cx + 24, cy, etiqueta, 11, ancla='start')
    return s

def fin(cx, cy, etiqueta=None, abajo=True):
    s = f'<circle cx="{cx}" cy="{cy}" r="16" fill="#ffebee" stroke="#c62828" stroke-width="4"/>'
    if etiqueta:
        s += texto(cx, cy + 32, etiqueta, 11) if abajo else texto(cx + 24, cy, etiqueta, 11, ancla='start')
    return s

def compuerta(cx, cy, pregunta):
    d = 26
    return (f'<polygon points="{cx},{cy - d} {cx + d},{cy} {cx},{cy + d} {cx - d},{cy}" fill="#fff8e1" stroke="#b7791f" stroke-width="1.8"/>'
            f'<path d="M{cx - 8},{cy - 8} L{cx + 8},{cy + 8} M{cx + 8},{cy - 8} L{cx - 8},{cy + 8}" stroke="#b7791f" stroke-width="2.4"/>'
            + texto(cx, cy - d - 14, pregunta, 11, 'bold'))

def pool(x0, x1, carriles, titulo):
    """carriles: [(nombre, y0, y1, fondo)]"""
    y0, y1 = carriles[0][1], carriles[-1][2]
    s = [f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" fill="none" stroke="{TINTA}" stroke-width="2"/>',
         f'<rect x="{x0}" y="{y0}" width="30" height="{y1 - y0}" fill="#e5e7eb" stroke="{TINTA}" stroke-width="2"/>',
         f'<text {F} font-size="13" font-weight="bold" fill="{TINTA}" text-anchor="middle" transform="translate({x0 + 15},{(y0 + y1) / 2}) rotate(-90)">{titulo}</text>']
    for nombre, a, b, fondo in carriles:
        s.append(f'<rect x="{x0 + 30}" y="{a}" width="{x1 - x0 - 30}" height="{b - a}" fill="{fondo}" stroke="{TINTA}" stroke-width="1.2"/>')
        s.append(f'<rect x="{x0 + 30}" y="{a}" width="30" height="{b - a}" fill="#eef2f6" stroke="{TINTA}" stroke-width="1.2"/>')
        s.append(f'<text {F} font-size="12" font-weight="bold" fill="{TINTA}" text-anchor="middle" transform="translate({x0 + 45},{(a + b) / 2}) rotate(-90)">{nombre}</text>')
    return s

# ───────────────────────── Lección 0 ─────────────────────────

def agente_gesi():
    W, H = 1200, 640
    s = lienzo(W, H, 'El diseño del Agente GESI', 'Tú le das un objetivo; el agente usa herramientas sobre tus datos y te pide aprobación')
    s.append(caja(470, 80, 260, 60, ['Tú (Nico)', 'terminal; después correo y WhatsApp'], '#fef3c7', '#b45309', 13))
    s.append(flecha([(560, 140), (560, 198)], 'objetivo', -38, 0))
    s.append(flecha([(640, 198), (640, 140)], 'propuesta para aprobar', 92, 0, color='#b45309'))
    # agente
    s.append(caja(420, 200, 360, 150, None, '#eff6ff', '#2563eb', grosor=2.4, rx=16))
    s.append(texto(600, 225, 'Agente GESI', 17, 'bold', color='#1d4ed8'))
    s.append(caja(440, 250, 150, 80, ['Modelo (Claude)', 'piensa y decide'], '#ffffff', '#2563eb', 12))
    s.append(caja(610, 250, 150, 80, ['Skills', 'tus reglas: filtro,', 'puntaje, formato'], '#ffffff', '#2563eb', 12))
    # ciclo
    s.append(caja(820, 215, 300, 120, None, '#f8fafc', '#94a3b8', rx=12))
    s.append(texto(970, 237, 'El ciclo, en cada paso', 13, 'bold'))
    for i, (t, c) in enumerate([('Piensa', '#2563eb'), ('Actúa', '#059669'), ('Observa', '#b45309')]):
        s.append(caja(835 + i * 95, 265, 80, 36, [t], '#ffffff', c, 12, 'bold', color=c))
        if i < 2:
            s.append(flecha([(915 + i * 95, 283), (930 + i * 95, 283)]))
    s.append(f'<path d="M1075,301 L1075,322 L875,322 L875,303" fill="none" stroke="{TINTA}" stroke-width="1.5" marker-end="url(#punta)"/>')
    s.append(f'<path d="M780,275 L818,275" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3"/>')
    # herramientas
    s.append(texto(100, 435, ['Herramientas:', 'lo que el', 'agente ejecuta'], 12, 'bold', color='#059669'))
    hs = [['leer_documento'], ['calcular_landed_cost'], ['buscar_cotizaciones'], ['registrar_cotizacion']]
    for i, h in enumerate(hs):
        x = 190 + i * 210
        s.append(caja(x, 410, 190, 50, h, '#ecfdf5', '#059669', 12))
        s.append(flecha([(600, 350), (x + 95, 408)], color='#059669'))
        s.append(flecha([(x + 95, 460), (600, 528)], color='#6b7280'))
    s.append(caja(330, 530, 540, 80, ['Base de datos (Importa)', 'proveedores · cotizaciones · productos · importaciones'], '#f5f3ff', '#7c3aed', 13, 'bold'))
    s.append(texto(890, 570, 'Una sola fuente de verdad:', 12, 'bold', ancla='start', color='#7c3aed'))
    s.append(texto(890, 590, 'el agente no guarda datos propios', 12, ancla='start', color='#7c3aed'))
    return guardar('agente-gesi', s, W, H)

# ───────────────────────── Lección 1 ─────────────────────────

def ciclos_gesi():
    W, H = 1440, 640
    s = lienzo(W, H, 'Los tres ciclos de GESI y dónde se tocan', 'Cada fila es un proceso que ocurre en ese orden, de izquierda a derecha')
    filas = [
        (['Procure-to-Pay', '(comprar)'], '#dbeafe', '#2563eb', 130,
         ['Necesidad', 'Buscar\nproveedores', 'Enviar RFQ', 'Recibir\ncotizaciones', 'Evaluar y\nseleccionar', 'Orden de\ncompra', 'Pagar\nanticipo', 'Producción e\ninspección', 'Pagar saldo']),
        (['Importación'], '#ccfbf1', '#0f766e', 300,
         ['Reservar\nespacio', 'Cargar y\nzarpar', 'Recibir BL', 'Tránsito', 'Llegada a\npuerto', 'Aduana (DIN)', 'Pagar\nderechos', 'Retiro del\npuerto', 'En bodega']),
        (['Order-to-Cash', '(vender)'], '#ffedd5', '#c2410c', 470,
         ['Prospecto', 'Contacto', 'Cotización\nal cliente', 'Negociación', 'Pedido', 'Despacho', 'Factura', 'Cobro', 'Conciliación']),
    ]
    x0, w, gap = 200, 122, 13
    cx = lambda i: x0 + i * (w + gap) + w / 2
    for nombre, fondo, borde, y, pasos in filas:
        s.append(caja(20, y - 30, 165, 60, nombre, borde, borde, 13, 'bold', color='#ffffff'))
        for i, p in enumerate(pasos):
            x = x0 + i * (w + gap)
            s.append(caja(x, y - 28, w, 56, p.split('\n'), fondo, borde, 11.5))
            if i:
                s.append(flecha([(x - gap, y), (x - 1, y)], color=borde))
    M = '#7c3aed'
    def etiqueta(x, y, t, ancho):
        s.append(caja(x - ancho / 2, y - 13, ancho, 26, [t], '#f5f3ff', M, 11.5, 'bold', rx=6, color=M))
    # compra lista -> importación
    s.append(flecha([(cx(8), 158), (cx(8), 215), (cx(0), 215), (cx(0), 270)], color=M, guion='6 4'))
    etiqueta((cx(8) + cx(0)) / 2, 215, 'Con la mercadería lista y pagada, empieza la importación', 400)
    # stock: En bodega -> Despacho
    s.append(flecha([(cx(8), 328), (cx(8), 380), (cx(5), 380), (cx(5), 440)], color=M, guion='6 4'))
    etiqueta((cx(8) + cx(5)) / 2 + 40, 380, 'El stock une lo que entra con lo que sale', 300)
    # landed cost: Pagar derechos -> Cotización al cliente
    s.append(flecha([(cx(6), 328), (cx(6), 408), (cx(2), 408), (cx(2), 440)], color=M, guion='6 4'))
    etiqueta((cx(6) + cx(2)) / 2 - 60, 408, 'El landed cost define el precio mínimo de venta', 340)
    # pedido sin stock -> necesidad
    s.append(flecha([(cx(4), 498), (cx(4), 545), (192, 545), (192, 130), (198, 130)], color=M, guion='6 4'))
    etiqueta((cx(4) + 192) / 2 + 20, 545, 'Un pedido sin stock dispara una compra nueva', 330)
    s.append(texto(200, 600, 'Línea punteada morada: dónde un ciclo alimenta al otro. Ahí es donde la primera app "no conversaba".', 12.5, ancla='start', color=M))
    return guardar('ciclos-gesi', s, W, H)

def scor_procesos():
    W, H = 1300, 620
    s = lienzo(W, H, 'SCOR: los 7 procesos de una cadena de suministro', 'No es una secuencia: son áreas que funcionan al mismo tiempo')
    s.append(caja(60, 80, 1180, 54, None, '#1e3a8a', '#1e3a8a', rx=8))
    s.append(texto(650, 100, 'ORCHESTRATE (dirigir)', 14, 'bold', color='#ffffff'))
    s.append(texto(650, 120, 'Qué líneas de negocio impulsar · reglas y riesgos de toda la cadena', 11.5, color='#dbeafe'))
    s.append(caja(60, 146, 1180, 54, None, '#3b82f6', '#3b82f6', rx=8))
    s.append(texto(650, 166, 'PLAN (planificar)', 14, 'bold', color='#ffffff'))
    s.append(texto(650, 186, 'Cuánta tubería traer para el invierno · cuándo pedir el próximo contenedor', 11.5, color='#eff6ff'))
    # fila central
    y = 300
    s.append(caja(60, y - 50, 150, 100, ['Proveedores', 'Lvzhou, Ikon,', 'Alibaba'], '#f3f4f6', '#6b7280', 12))
    procesos = [('SOURCE', 'abastecer', 'Buscar, cotizar,\ncomprar, importar', '#0f766e', '#ccfbf1'),
                ('TRANSFORM', 'transformar', 'Etiquetado con\nmarca propia (OEM)', '#7c3aed', '#ede9fe'),
                ('FULFILL', 'entregar', 'Despachos a Punta\nArenas, envíos ML', '#c2410c', '#ffedd5')]
    xs = [270, 560, 850]
    for x, (n, sub, ej, b, f) in zip(xs, procesos):
        s.append(caja(x, y - 60, 230, 120, None, f, b, grosor=2.2, rx=12))
        s.append(texto(x + 115, y - 34, n, 15, 'bold', color=b))
        s.append(texto(x + 115, y - 14, f'({sub})', 11.5, color=b))
        s.append(texto(x + 115, y + 22, ej.split('\n'), 11.5))
    s.append(caja(1110, y - 50, 150, 100, ['Clientes', 'salmoneras,', 'ferreterías, ML'], '#f3f4f6', '#6b7280', 12))
    for a, b in [(210, 268), (500, 558), (790, 848), (1080, 1108)]:
        s.append(flecha([(a, y), (b, y)], color='#374151'))
    s.append(texto(650, 375, 'Productos → (de izquierda a derecha)', 11.5, color=SUAVE))
    # order y return
    s.append(caja(850, 420, 230, 70, ['ORDER (pedidos)', 'Recibir y gestionar pedidos'], '#fef3c7', '#b45309', 12, 'bold'))
    s.append(flecha([(1185, 350), (1185, 455), (1082, 455)], 'pedido', -30, 0, color='#b45309'))
    s.append(flecha([(965, 420), (965, 362)], color='#b45309'))
    s.append(caja(270, 520, 810, 60, ['RETURN (devoluciones): devoluciones de Mercado Libre, reclamos de calidad al proveedor'], '#fee2e2', '#b91c1c', 12, 'bold'))
    s.append(flecha([(1210, 350), (1210, 550), (1082, 550)], color='#b91c1c', guion='6 4'))
    s.append(flecha([(270, 550), (135, 550), (135, 352)], color='#b91c1c', guion='6 4'))
    return guardar('scor-procesos', s, W, H)

def scor_metricas():
    W, H = 1300, 520
    s = lienzo(W, H, 'Cómo mide SCOR: métricas por niveles', 'De arriba hacia abajo: de "cómo vamos" a "dónde está el problema"')
    niveles = [('Nivel 1', 'Cómo va la cadena', '#1e3a8a', 'Pedido perfecto: 8 de 10 despachos → 80 %', 'Pocas métricas, para el dueño'),
               ('Nivel 2', 'Por qué va así', '#2563eb', 'De los 2 que fallaron: 1 llegó tarde · 1 con factura mal emitida', 'Separa el problema por tipo'),
               ('Nivel 3', 'Dónde actuar', '#60a5fa', 'El atraso fue en aduana: 6 días esperando el certificado de origen', 'Apunta al paso exacto')]
    cx, top, alto = 300, 90, 120
    for i, (n, q, c, ej, ayuda) in enumerate(niveles):
        y = top + i * (alto + 12)
        mitad_arriba = 50 + i * 70
        mitad_abajo = 50 + (i + 1) * 70
        pts = f'{cx - mitad_arriba},{y} {cx + mitad_arriba},{y} {cx + mitad_abajo},{y + alto} {cx - mitad_abajo},{y + alto}'
        s.append(f'<polygon points="{pts}" fill="{c}"/>')
        s.append(texto(cx, y + alto / 2 - 12, n, 16, 'bold', color='#ffffff'))
        s.append(texto(cx, y + alto / 2 + 12, q, 13, color='#ffffff'))
        s.append(flecha([(cx + mitad_abajo + 20, y + alto / 2), (640, y + alto / 2)], color=c))
        s.append(caja(645, y + 18, 620, alto - 36, [ej], '#f8fafc', c, 12.5))
        s.append(texto(955, y + alto - 6, ayuda, 11, color=SUAVE))
    return guardar('scor-metricas', s, W, H)

def niveles_bpmn():
    W, H = 1440, 955
    s = lienzo(W, H, 'Los procesos se dibujan por niveles', 'Cada caja con [+] es un subproceso: se abre en su propio diagrama BPMN')
    # nivel 1
    s.append(texto(30, 92, 'NIVEL 1 — Mapa general de GESI', 14, 'bold', ancla='start', color='#1d4ed8'))
    nombres = ['Buscar\nproveedor', 'Comprar', 'Importar', 'Vender', 'Cobrar']
    xs = [140 + i * 250 for i in range(5)]
    for i, (x, n) in enumerate(zip(xs, nombres)):
        s.append(tarea(x, 150, n.split('\n'), w=170, h=64, sub=True, resalte=(i == 0)))
        if i:
            s.append(flecha([(x - 80, 150), (x - 2, 150)]))
    s.append(inicio(80, 150))
    s.append(flecha([(96, 150), (138, 150)]))
    s.append(fin(xs[-1] + 210, 150))
    s.append(flecha([(xs[-1] + 170, 150), (xs[-1] + 192, 150)]))
    # zoom
    s.append(f'<path d="M140,182 L40,270 M310,182 L1400,270" stroke="#b45309" stroke-width="1.5" stroke-dasharray="6 4" fill="none"/>')
    s.append(texto(720, 215, 'se abre', 12, 'bold', color='#b45309'))
    # nivel 2
    s.append(texto(30, 255, 'NIVEL 2 — BPMN "Buscar proveedor"', 14, 'bold', ancla='start', color='#b45309'))
    car = [('Nico', 275, 455, '#f3f7fb'), ('Agente GESI', 455, 605, '#ffffff'), ('Proveedor', 605, 755, '#f3f7fb')]
    s += pool(40, 1400, car, 'Buscar proveedor')
    yn, yn2, ya, yp = 330, 410, 530, 680
    s += [inicio(160, yn, ['Necesidad', 'detectada']),
          flecha([(176, yn), (186, yn), (186, ya), (198, ya)]),
          tarea(200, ya, ['Identificar', 'candidatos']),
          flecha([(324, ya), (360, ya), (360, yn), (388, yn)]),
          tarea(390, yn, ['Aprobar lista', 'y RFQ']),
          flecha([(514, yn), (540, yn), (540, ya), (568, ya)]),
          tarea(570, ya, ['Enviar RFQ']),
          flecha([(632, ya + 26), (632, yp - 26)]),
          tarea(570, yp, ['Cotizar']),
          flecha([(694, yp), (730, yp), (730, ya), (758, ya)]),
          tarea(760, ya, ['Evaluar', 'cotización'], w=140, h=60, sub=True, resalte=True),
          flecha([(830, ya - 30), (830, yn), (932, yn)]),
          compuerta(960, yn, '¿Exige muestra?'),
          flecha([(960, yn + 26), (960, yp - 26)], 'Sí', 16, 0),
          tarea(898, yp, ['Enviar', 'muestra']),
          flecha([(1022, yp), (1062, yp), (1062, yn2 + 28)]),
          tarea(1000, yn2, ['Evaluar', 'muestra']),
          flecha([(1124, yn2), (1172, yn2), (1172, yn + 28)]),
          flecha([(986, yn), (1108, yn)], 'No', 0, -12),
          tarea(1110, yn, ['Homologar']),
          flecha([(1234, yn), (1300, yn)]),
          fin(1318, yn, 'Homologado')]
    # nivel 3
    s.append(f'<path d="M830,{ya + 30} L830,775" stroke="#b45309" stroke-width="1.5" stroke-dasharray="6 4"/>')
    s.append(texto(30, 790, 'NIVEL 3 — BPMN "Evaluar cotización"', 14, 'bold', ancla='start', color='#b45309'))
    s.append(caja(40, 810, 1360, 120, None, '#fff7ed', '#b45309', rx=12, guion='6 4'))
    s.append(texto(720, 845, 'Es el diagrama "Evaluar una cotización de proveedor" de la sección BPMN:', 14, 'bold'))
    s.append(texto(720, 873, 'leer la cotización → ¿formato GESI? → filtro eliminatorio → landed cost y puntaje → tu aprobación', 13))
    s.append(texto(720, 903, 'Así el nivel 2 queda limpio: muestra "Evaluar cotización [+]" como un solo paso.', 12, color=SUAVE))
    return guardar('niveles-bpmn', s, W, H)

# ───────────────────────── Lección 2 ─────────────────────────

def contextos_gesi():
    W, H = 1200, 560
    s = lienzo(W, H, 'Los contextos de GESI y sus contratos', 'Cada área tiene sus datos; las flechas dicen qué dato pasa de una a otra')
    def ctx(x, y, nombre, items, c, f):
        s.append(caja(x, y, 300, 150, None, f, c, grosor=2.2, rx=14))
        s.append(texto(x + 150, y + 26, nombre, 16, 'bold', color=c))
        s.append(texto(x + 150, y + 85, items, 12.5))
    ctx(80, 90, 'Abastecimiento', ['proveedores · RFQ', 'cotizaciones', 'órdenes de compra'], '#0f766e', '#ccfbf1')
    ctx(820, 90, 'Importación', ['embarques · aduana', 'gastos · landed cost'], '#1d4ed8', '#dbeafe')
    ctx(80, 370, 'Ventas B2B', ['prospectos · clientes', 'ofertas · pedidos'], '#c2410c', '#ffedd5')
    ctx(820, 370, 'Mercado Libre', ['SKUs · publicaciones', 'ventas · comisiones'], '#b45309', '#fef3c7')
    s.append(flecha([(380, 165), (818, 165)], 'producto elegido + precio de la OC', 0, -14, '#374151', tam=12))
    s.append(flecha([(970, 240), (970, 368)], 'landed cost por producto', 98, 0, '#374151', tam=12))
    s.append(flecha([(900, 240), (300, 368)], 'landed cost por producto', -60, -10, '#374151', tam=12))
    return guardar('contextos-gesi', s, W, H)

def ids_relacion():
    W, H = 1100, 420
    s = lienzo(W, H, 'Las relaciones se hacen por ID, no por nombre', 'La cotización guarda el número del proveedor')
    def tabla(x, y, titulo, filas, c, f, resaltar):
        s.append(caja(x, y, 340, 44, [titulo], c, c, 15, 'bold', rx=8, color='#ffffff'))
        for i, (k, v) in enumerate(filas):
            yy = y + 44 + i * 40
            fondo = '#fef3c7' if k == resaltar else f
            s.append(f'<rect x="{x}" y="{yy}" width="340" height="40" fill="{fondo}" stroke="{c}" stroke-width="1.2"/>')
            s.append(texto(x + 16, yy + 20, k, 13, 'bold', ancla='start'))
            s.append(texto(x + 180, yy + 20, v, 13, ancla='start'))
    tabla(80, 100, 'Proveedor', [('id', '7'), ('nombre', 'Lvzhou'), ('país', 'China')], '#0f766e', '#f0fdfa', 'id')
    tabla(680, 100, 'Cotización', [('id', '31'), ('proveedor_id', '7'), ('incoterm', 'FOB'), ('lugar', 'Ningbo'), ('fecha', '03-11-2026')], '#1d4ed8', '#eff6ff', 'proveedor_id')
    s.append(flecha([(678, 204), (422, 164)], 'apunta al proveedor 7', 0, -26, '#b45309', tam=12))
    s.append(texto(550, 380, 'Aunque escribas "Lvzhou", "LVZHOU Co." o "proveedor tubería", la relación no se rompe: el 7 no cambia.', 13, color=SUAVE))
    return guardar('ids-proveedor-cotizacion', s, W, H)

def modelo_abastecimiento():
    W, H = 1300, 800
    s = lienzo(W, H, 'Modelo entidad-relación: Abastecimiento', 'Cada caja es una tabla; las líneas dicen cuántos de cada lado (1 o N = muchos)')
    def entidad(x, y, nombre, attrs, c='#0f766e'):
        s.append(caja(x, y, 230, 38, [nombre], c, c, 14, 'bold', rx=8, color='#ffffff'))
        h = 26 * len(attrs) + 10
        s.append(f'<rect x="{x}" y="{y + 38}" width="230" height="{h}" fill="#ffffff" stroke="{c}" stroke-width="1.4"/>')
        for i, a in enumerate(attrs):
            peso = 'bold' if a.startswith('🔑') or a.startswith('↗') else 'normal'
            s.append(texto(x + 14, y + 56 + i * 26, a.replace('🔑 ', 'PK  ').replace('↗ ', 'FK  '), 12, peso, ancla='start'))
        return (x, y, 230, 38 + h)
    def rel(p1, p2, a, b, ea=(0, 0), eb=(0, 0)):
        s.append(f'<path d="M{p1[0]},{p1[1]} L{p2[0]},{p2[1]}" stroke="{TINTA}" stroke-width="1.7"/>')
        s.append(texto(p1[0] + ea[0], p1[1] + ea[1], a, 13, 'bold', color='#b45309'))
        s.append(texto(p2[0] + eb[0], p2[1] + eb[1], b, 13, 'bold', color='#b45309'))
    entidad(60, 90, 'Proveedor', ['🔑 id', 'nombre', 'país', 'plataforma'])
    entidad(60, 330, 'Contacto', ['🔑 id', '↗ proveedor_id', 'nombre', 'teléfono'])
    entidad(380, 90, 'Solicitud (RFQ)', ['🔑 id', '↗ proveedor_id', 'fecha', 'producto pedido'])
    entidad(700, 90, 'Cotización', ['🔑 id', '↗ rfq_id', 'moneda', 'incoterm + lugar', 'validez'])
    entidad(700, 400, 'LíneaCotización', ['🔑 id', '↗ cotización_id', '↗ producto_id', 'precio unitario', 'MOQ · lead time'])
    entidad(1020, 400, 'Producto', ['🔑 id', 'nombre', 'código HS', 'especificación'])
    entidad(380, 400, 'OrdenCompra', ['🔑 id', '↗ línea elegida', 'precio (congelado)', 'cantidad'], '#1d4ed8')
    entidad(380, 620, 'Embarque', ['🔑 id', '↗ orden_id', 'BL', 'ETA'], '#1d4ed8')
    rel((175, 242), (175, 328), '1', 'N', (14, 10), (14, -12))
    rel((290, 140), (378, 140), '1', 'N', (10, -12), (-10, -12))
    rel((610, 140), (698, 140), '1', 'N', (10, -12), (-10, -12))
    rel((815, 268), (815, 398), '1', 'N', (14, 10), (14, -12))
    rel((930, 470), (1018, 470), 'N', '1', (10, -12), (-10, -12))
    rel((698, 470), (612, 470), '1', '1', (-10, -12), (10, -12))
    rel((495, 552), (495, 618), '1', 'N', (14, 10), (14, -12))
    s.append(texto(1000, 680, 'PK = clave primaria (el ID de la tabla)', 12, ancla='start', color=SUAVE))
    s.append(texto(1000, 702, 'FK = clave foránea (el ID de otra tabla)', 12, ancla='start', color=SUAVE))
    s.append(texto(1000, 724, 'Azul: se crea al comprar', 12, ancla='start', color='#1d4ed8'))
    return guardar('modelo-abastecimiento', s, W, H)

def estados_cotizacion():
    W, H = 1200, 600
    s = lienzo(W, H, 'Máquina de estados: Cotización', 'Rectángulos: estados · flechas: el evento que provoca el cambio')
    def est(x, y, n, final=False, c='#1d4ed8', f='#eff6ff'):
        s.append(caja(x, y, 170, 54, [n], f, c, 14, 'bold', rx=27, grosor=2, color=c))
        if final:
            s.append(f'<rect x="{x - 5}" y="{y - 5}" width="180" height="64" rx="32" fill="none" stroke="{c}" stroke-width="1.5"/>')
    s.append(f'<circle cx="80" cy="147" r="10" fill="{TINTA}"/>')
    s.append(flecha([(90, 147), (148, 147)], 'RFQ enviada', 0, 20))
    est(150, 120, 'SOLICITADA')
    est(520, 120, 'SIN RESPUESTA', True, '#6b7280', '#f3f4f6')
    s.append(flecha([(320, 147), (518, 147)], 'pasó el plazo sin respuesta', 0, -14))
    est(150, 290, 'RECIBIDA')
    s.append(flecha([(235, 174), (235, 288)], 'llegó la cotización', 82, 0))
    est(520, 290, 'INCOMPLETA', False, '#b45309', '#fff7ed')
    s.append(flecha([(320, 305), (518, 305)], 'formato malo o faltan datos', 0, -14))
    s.append(flecha([(518, 333), (322, 333)], 'reenvío correcto', 0, 16))
    est(150, 450, 'EVALUADA')
    s.append(flecha([(235, 344), (235, 448)], 'filtro + puntaje', 70, 0))
    est(520, 410, 'SELECCIONADA', True, '#047857', '#ecfdf5')
    est(520, 510, 'DESCARTADA', True, '#b91c1c', '#fef2f2')
    s.append(flecha([(320, 465), (518, 437)], 'Nico aprueba', 0, -14))
    s.append(flecha([(320, 488), (518, 537)], 'no pasa o se elige otra', -10, 18))
    s.append(caja(800, 260, 360, 150, None, '#f8fafc', '#94a3b8', rx=12))
    s.append(texto(980, 284, 'Reglas (guardas)', 14, 'bold'))
    s.append(texto(820, 318, '• Solo una RECIBIDA puede pasar a EVALUADA', 12, ancla='start'))
    s.append(texto(820, 342, '• Solo una EVALUADA puede quedar SELECCIONADA', 12, ancla='start'))
    s.append(texto(820, 366, '• SELECCIONADA exige tu aprobación', 12, ancla='start'))
    s.append(texto(820, 390, '• Doble borde = estado final', 12, ancla='start'))
    return guardar('estados-cotizacion', s, W, H)

def estados_importacion():
    W, H = 1300, 330
    s = lienzo(W, H, 'Máquina de estados: Importación', 'Una importación avanza siempre en este orden: no puede estar "en bodega" sin haber sido "internada"')
    estados = ['OC emitida', 'Anticipo pagado', 'En producción', 'Inspeccionada', 'Embarcada', 'En tránsito', 'En aduana', 'Internada', 'En bodega']
    for i, e in enumerate(estados):
        fila, col = divmod(i, 5)
        x = 60 + col * 245 + (120 if fila else 0)
        y = 100 + fila * 120
        final = i == len(estados) - 1
        s.append(caja(x, y, 190, 52, [e], '#ecfdf5' if final else '#eff6ff', '#047857' if final else '#1d4ed8', 13, 'bold', rx=26, grosor=2))
        if col < 4 and i < len(estados) - 1 and not (fila == 0 and col == 4):
            s.append(flecha([(x + 190, y + 26), (x + 243, y + 26)]))
    s.append(flecha([(1135, 152), (1135, 185), (275, 185), (275, 218)]))
    return guardar('estados-importacion', s, W, H)

def hacia_donde_vamos():
    W, H = 1300, 720
    s = lienzo(W, H, 'Hacia dónde vamos', 'Una sola app con los datos, un agente encima y dos sesiones de trabajo con tareas separadas')
    # canales
    s.append(texto(60, 95, 'CÓMO LE HABLAS', 13, 'bold', ancla='start', color='#b45309'))
    for i, c in enumerate(['Celular / app de Claude', 'WhatsApp', 'Outlook @gesi.cl', 'Alibaba (vía Chrome)']):
        s.append(caja(60 + i * 250, 110, 220, 50, [c], '#fef3c7', '#b45309', 12.5))
        s.append(flecha([(170 + i * 250, 162), (170 + i * 250, 208)], color='#b45309'))
    # agente
    s.append(caja(60, 210, 970, 130, None, '#eff6ff', '#2563eb', grosor=2.4, rx=16))
    s.append(texto(545, 238, 'Agente GESI  (se construye en el curso)', 16, 'bold', color='#1d4ed8'))
    s.append(texto(545, 272, 'Lee, propone y registra. Te pide aprobación antes de enviar o comprometer dinero.', 12.5))
    s.append(texto(545, 302, 'Usa herramientas que llaman a las mismas funciones de Importa: no tiene datos propios.', 12.5, color=SUAVE))
    s.append(flecha([(545, 342), (545, 398)], 'herramientas', 52, 0, '#2563eb'))
    # importa
    s.append(caja(60, 400, 970, 170, None, '#f5f3ff', '#7c3aed', grosor=2.4, rx=16))
    s.append(texto(545, 428, 'Importa  (la app que ya tienes, ordenada y completada)', 16, 'bold', color='#6d28d9'))
    mods = [('Comprar', 'RFQ · cotizaciones\nhomologación · OC'), ('Importar', 'operaciones · hitos\ngastos · BL · DIN'), ('Vender', 'embudo · ofertas\nfactura · cobro')]
    for i, (n, d) in enumerate(mods):
        x = 90 + i * 310
        s.append(caja(x, 450, 290, 90, None, '#ffffff', '#7c3aed', rx=10))
        s.append(texto(x + 145, 470, n, 14, 'bold', color='#6d28d9'))
        s.append(texto(x + 145, 507, d.split('\n'), 12))
    s.append(texto(545, 555, 'Una sola base de datos: la fuente de verdad de GESI', 12, 'bold', color='#6d28d9'))
    # sesiones
    s.append(texto(1060, 95, 'QUIÉN TRABAJA EN QUÉ', 13, 'bold', ancla='start', color=TINTA))
    s.append(caja(1060, 210, 210, 130, ['Sesión del curso', '(esta)', 'lecciones · diseño', 'y construcción', 'del agente'], '#eff6ff', '#2563eb', 12))
    s.append(caja(1060, 400, 210, 170, ['Sesión de Importa', '(la otra)', 'módulos de la app:', 'RFQ, factura, cobro', 'y su base de datos'], '#f5f3ff', '#7c3aed', 12))
    s.append(flecha([(1058, 275), (1032, 275)], color='#2563eb'))
    s.append(flecha([(1058, 485), (1032, 485)], color='#7c3aed'))
    s.append(caja(60, 600, 1210, 90, None, '#f8fafc', '#94a3b8', rx=12))
    s.append(texto(665, 625, 'Las dos sesiones se coordinan por GitHub, no por memoria:', 13, 'bold'))
    s.append(texto(665, 652, 'cada una sube sus cambios a su repositorio, y la otra trae lo último antes de empezar.', 12.5))
    s.append(texto(665, 676, 'Lo que hay que recordar queda escrito en REGLAS.md y CLAUDE.md, no en la conversación.', 12.5, color=SUAVE))
    return guardar('hacia-donde-vamos', s, W, H)

# ───────────────────────── Diseño P2P (app nueva) ─────────────────────────

def bpmn_p2p():
    W, H = 2080, 640
    s = lienzo(W, H, 'BPMN — Comprar (P2P), nivel 2', 'De la necesidad a la mercadería lista para importar · quién hace cada paso')
    car = [('Nico', 80, 230, '#f3f7fb'), ('Agente GESI', 230, 360, '#ffffff'), ('Proveedor', 360, 490, '#f3f7fb')]
    s += pool(20, 2060, car, 'Comprar (P2P)')
    n, a, p = 155, 295, 425
    s += [inicio(110, n, ['Necesidad', 'detectada']),
          flecha([(126, n), (138, n)]), tarea(140, n, ['Crear RFQ']),
          flecha([(264, n), (277, n), (277, a), (288, a)]), tarea(290, a, ['Preparar textos', 'EN / ZH']),
          flecha([(414, a), (427, a), (427, n), (438, n)]), tarea(440, n, ['Aprobar y', 'enviar RFQ']),
          flecha([(564, n), (577, n), (577, p), (588, p)]), tarea(590, p, ['Cotizar']),
          flecha([(714, p), (727, p), (727, a), (738, a)]), tarea(740, a, ['Registrar', 'cotización']),
          flecha([(864, a), (888, a)]), tarea(890, a, ['Evaluar', 'cotización'], w=140, h=60, sub=True, resalte=True),
          flecha([(1030, a), (1080, a), (1080, n + 28)]), compuerta(1080, n, '¿Elegir proveedor?'),
          flecha([(1054, n), (1020, n)], 'No', 0, -12), fin(1002, n, ['Nueva', 'RFQ']),
          flecha([(1106, n), (1148, n)], 'Sí', 0, -12), tarea(1150, n, ['Emitir OC']),
          flecha([(1274, n), (1287, n), (1287, p), (1298, p)]), tarea(1300, p, ['Enviar', 'proforma (PI)']),
          flecha([(1424, p), (1437, p), (1437, n), (1448, n)]), tarea(1450, n, ['Pagar', 'anticipo']),
          flecha([(1574, n), (1587, n), (1587, p), (1598, p)]), tarea(1600, p, ['Producir']),
          flecha([(1724, p), (1760, p), (1760, n + 28)]), compuerta(1760, n, '¿Inspección OK?'),
          flecha([(1734, n), (1708, n)], 'No', 0, -12), fin(1690, n, 'Reclamo'),
          flecha([(1786, n), (1826, n)], 'Sí', 0, -12), tarea(1828, n, ['Pagar saldo']),
          flecha([(1952, n), (1982, n)]), fin(2000, n, ['Lista para', 'importar'])]
    s.append(texto(40, 525, 'Notas', 14, 'bold', ancla='start'))
    notas = ['La RFQ va a varios proveedores. Si uno no responde en el plazo, su invitación queda "Sin respuesta": lo vigila el agente.',
             '"Evaluar cotización [+]" se abre en el diagrama de la Lección 1: formato, filtro eliminatorio, landed cost y puntaje.',
             '"Lista para importar" es donde empieza el proceso Importación. Nico aprueba todo lo que compromete dinero o se envía a terceros.']
    for i, t in enumerate(notas):
        s.append(texto(40, 555 + i * 26, '• ' + t, 13, ancla='start'))
    return guardar('bpmn-p2p', s, W, H)

def modelo_p2p():
    W, H = 1400, 720
    s = lienzo(W, H, 'Modelo de datos del P2P', 'La pieza nueva es "Compra": representa el proceso y sabe en qué paso va')
    def ent(x, y, nombre, attrs, c='#0f766e', destacar=False):
        borde = '#b45309' if destacar else c
        s.append(caja(x, y, 260, 40, [nombre], borde, borde, 14, 'bold', rx=8, color='#ffffff'))
        h = 26 * len(attrs) + 10
        s.append(f'<rect x="{x}" y="{y + 40}" width="260" height="{h}" fill="{"#fff7ed" if destacar else "#ffffff"}" stroke="{borde}" stroke-width="{2.2 if destacar else 1.4}"/>')
        for i, a in enumerate(attrs):
            peso = 'bold' if a.startswith(('PK', 'FK')) else 'normal'
            s.append(texto(x + 14, y + 58 + i * 26, a, 12, peso, ancla='start'))
    def rel(p1, p2, a, b, ea, eb, etiqueta=None, el=(0, 0)):
        s.append(f'<path d="M{p1[0]},{p1[1]} L{p2[0]},{p2[1]}" stroke="{TINTA}" stroke-width="1.7"/>')
        s.append(texto(p1[0] + ea[0], p1[1] + ea[1], a, 13, 'bold', color='#b45309'))
        s.append(texto(p2[0] + eb[0], p2[1] + eb[1], b, 13, 'bold', color='#b45309'))
        if etiqueta:
            s.append(texto((p1[0] + p2[0]) / 2 + el[0], (p1[1] + p2[1]) / 2 + el[1], etiqueta, 11, color=SUAVE))
    ent(40, 90, 'Producto', ['PK id', 'nombre', 'especificación', 'código HS'])
    ent(400, 90, 'Compra  (el proceso)', ['PK id · código GESI-CP', 'FK producto_id', 'cantidad', 'incoterm + lugar pedido', 'plazo de respuesta', 'etapa'], destacar=True)
    ent(760, 90, 'OrdenCompra', ['PK id', 'FK compra_id', 'FK cotización_id', 'precio (congelado)'], '#1d4ed8')
    ent(1110, 90, 'Pago', ['PK id', 'FK orden_id', 'tipo: anticipo / saldo', 'monto · fecha'], '#1d4ed8')
    ent(40, 420, 'Proveedor', ['PK id', 'nombre · país', 'canal: WhatsApp / Alibaba / correo'])
    ent(400, 420, 'Invitación  (RFQ a un proveedor)', ['PK id', 'FK compra_id', 'FK proveedor_id', 'enviada el', 'estado'], '#7c3aed')
    ent(760, 420, 'Cotización', ['PK id', 'FK invitación_id', 'precio + moneda', 'incoterm + lugar', 'MOQ · lead time · validez'])
    rel((300, 160), (398, 160), '1', 'N', (12, -12), (-12, -12))
    rel((660, 160), (758, 160), '1', '0..1', (12, -12), (-18, -12))
    rel((1020, 160), (1108, 160), '1', 'N', (12, -12), (-12, -12))
    rel((530, 296), (530, 418), '1', 'N', (14, 12), (14, -12), 'se envía a varios', (64, 0))
    rel((300, 490), (398, 490), '1', 'N', (12, -12), (-12, -12))
    rel((660, 490), (758, 490), '1', '0..1', (12, -12), (-18, -12), 'responde con', (0, 16))
    rel((890, 418), (890, 248), '1', '0..1', (14, -12), (22, 12), 'la elegida', (44, 0))
    s.append(caja(40, 640, 1320, 56, None, '#f8fafc', '#94a3b8', rx=10))
    s.append(texto(700, 658, 'Naranja: el proceso · Morado: la RFQ, nueva · Verde: ya existe en Importa (se reutiliza) · Azul: lo que se crea al comprar', 12.5))
    s.append(texto(700, 680, 'PK = clave primaria (ID de la tabla) · FK = clave foránea (ID de otra tabla) · 0..1 = puede no existir todavía', 12, color=SUAVE))
    return guardar('modelo-p2p', s, W, H)

def estados_compra():
    W, H = 1100, 730
    s = lienzo(W, H, 'Etapas de una Compra y de una Invitación', 'Las etapas avanzan en orden; las marcadas con ⚙ se despejan solas de lo que registras')
    etapas = [('Necesidad', False), ('Cotizando ⚙', True), ('Evaluando ⚙', True), ('Proveedor elegido', False), ('OC emitida ⚙', True),
              ('Anticipo pagado ⚙', True), ('En producción', False), ('Inspeccionada', False), ('Saldo pagado ⚙', True), ('Lista para importar', False)]
    s.append(texto(40, 92, 'COMPRA', 14, 'bold', ancla='start', color='#b45309'))
    for i, (e, auto) in enumerate(etapas):
        fila, col = divmod(i, 5)
        x = 40 + col * 190 + (60 if fila else 0)
        y = 110 + fila * 110
        final = i == len(etapas) - 1
        s.append(caja(x, y, 160, 50, [e], '#ecfdf5' if final else ('#fff7ed' if auto else '#eff6ff'), '#047857' if final else ('#b45309' if auto else '#1d4ed8'), 12, 'bold', rx=25, grosor=2))
        if col < 4 and i < len(etapas) - 1:
            s.append(flecha([(x + 160, y + 25), (x + 188, y + 25)]))
    s.append(flecha([(880, 160), (880, 192), (140, 192), (140, 218)]))
    s.append(caja(420, 330, 200, 50, ['Cancelada'], '#fef2f2', '#b91c1c', 13, 'bold', rx=25, grosor=2))
    s.append(texto(640, 355, 'desde cualquier etapa, con motivo escrito', 12, ancla='start', color='#b91c1c'))
    autos = ['⚙ Cotizando: al enviar la primera invitación', '⚙ Evaluando: al registrar la primera cotización',
             '⚙ OC emitida, Anticipo pagado, Saldo pagado: al registrar la OC y cada pago']
    for i, t in enumerate(autos):
        s.append(texto(40, 420 + i * 24, t, 12, ancla='start', color='#b45309'))
    # invitación
    s.append(f'<path d="M40,500 L1060,500" stroke="#e5e7eb" stroke-width="1.5"/>')
    s.append(texto(40, 530, 'INVITACIÓN (una por cada proveedor invitado)', 14, 'bold', ancla='start', color='#7c3aed'))
    s.append(texto(40, 575, ['Cada proveedor tiene su propio estado:', 'así ves de un vistazo quién respondió', 'y quién no. La Compra pasa sola a', '"Evaluando" con la primera Respondida.'], 12.5, ancla='start'))
    s.append(caja(560, 540, 160, 48, ['Enviada'], '#eff6ff', '#1d4ed8', 13, 'bold', rx=24, grosor=2))
    s.append(caja(440, 650, 160, 46, ['Respondida ⚙'], '#ecfdf5', '#047857', 12, 'bold', rx=23, grosor=2))
    s.append(caja(620, 650, 160, 46, ['Sin respuesta ⚙'], '#f3f4f6', '#6b7280', 12, 'bold', rx=23, grosor=2))
    s.append(caja(800, 650, 120, 46, ['Declinó'], '#fef2f2', '#b91c1c', 12, 'bold', rx=23, grosor=2))
    s.append(flecha([(600, 588), (530, 648)], 'cotizó', -40, 0))
    s.append(flecha([(660, 588), (690, 648)], 'pasó el plazo', 62, 0))
    s.append(flecha([(720, 564), (860, 564), (860, 648)], 'dijo que no', 0, -12))
    return guardar('estados-compra', s, W, H)

if __name__ == '__main__':
    hechos = [agente_gesi(), ciclos_gesi(), scor_procesos(), scor_metricas(), niveles_bpmn(),
              contextos_gesi(), ids_relacion(), modelo_abastecimiento(), estados_cotizacion(), estados_importacion(),
              hacia_donde_vamos(), bpmn_p2p(), modelo_p2p(), estados_compra()]
    import json
    with open(os.path.join(SALIDA, 'diagramas.json'), 'w') as f:
        json.dump(hechos, f)
    print('\n'.join(n for n, _, _ in hechos))
