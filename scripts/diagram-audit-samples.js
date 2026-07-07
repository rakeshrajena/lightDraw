/** Shared diagram samples for audit screenshots */
window.DIAGRAM_AUDIT_SAMPLES = {
  flowchart(app, w, h) {
    return LightDraw.Diagram.flowchart(
      app,
      {
        nodes: [
          { id: 'start', label: 'Start', type: 'start', x: 380, y: 24 },
          { id: 'check', label: 'Valid input?', type: 'decision', x: 350, y: 100 },
          { id: 'process', label: 'Process data', x: 350, y: 190 },
          { id: 'end', label: 'Complete', type: 'end', x: 380, y: 280 },
        ],
        edges: [
          { from: 'start', to: 'check' },
          { from: 'check', to: 'process', label: 'yes' },
          { from: 'process', to: 'end' },
        ],
      },
      { width: w, height: h }
    );
  },
  stateMachine(app, w, h) {
    return LightDraw.Diagram.stateMachine(
      app,
      {
        states: [
          { id: 'idle', label: 'Idle', type: 'initial', x: 60, y: 200 },
          { id: 'load', label: 'Loading', x: 240, y: 80 },
          { id: 'run', label: 'Running', x: 440, y: 200 },
          { id: 'err', label: 'Error', x: 240, y: 340 },
          { id: 'done', label: 'Done', type: 'final', x: 640, y: 200 },
        ],
        transitions: [
          { from: 'idle', to: 'load', label: 'fetch' },
          { from: 'load', to: 'run', label: 'ok' },
          { from: 'load', to: 'err', label: 'fail' },
          { from: 'run', to: 'done', label: 'complete' },
          { from: 'err', to: 'idle', label: 'retry' },
        ],
      },
      { width: w, height: h }
    );
  },
  network(app, w, h) {
    return LightDraw.Diagram.network(
      app,
      {
        nodes: [
          { id: 'r1', label: 'Edge Router', type: 'router', x: 400, y: 40 },
          { id: 's1', label: 'API Server', type: 'server', x: 180, y: 170 },
          { id: 's2', label: 'Database', type: 'server', x: 400, y: 170 },
          { id: 's3', label: 'Cache', type: 'server', x: 620, y: 170 },
          { id: 'c1', label: 'Client A', type: 'client', x: 120, y: 320 },
          { id: 'c2', label: 'Client B', type: 'client', x: 680, y: 320 },
        ],
        edges: [
          { from: 'r1', to: 's1', label: 'eth0' },
          { from: 'r1', to: 's2' },
          { from: 'r1', to: 's3' },
          { from: 's1', to: 'c1' },
          { from: 's3', to: 'c2' },
        ],
      },
      { width: w, height: h }
    );
  },
  can(app, w, h) {
    return LightDraw.Diagram.canNetwork(
      app,
      {
        busLabel: 'CAN HS · 500 kbps',
        ecus: [
          { id: 'ecm', label: 'ECM', address: '0x7E0' },
          { id: 'tcu', label: 'TCU', address: '0x7E1' },
          { id: 'abs', label: 'ABS', address: '0x7E2' },
          { id: 'bcm', label: 'BCM', address: '0x7E3' },
          { id: 'icu', label: 'ICU', address: '0x7E4' },
        ],
      },
      { width: w, height: h, x: 24, y: 100 }
    );
  },
  pipeline(app, w, h) {
    return LightDraw.Diagram.pipeline(
      app,
      [
        { id: 'ingest', label: 'Ingest', status: 'done' },
        { id: 'validate', label: 'Validate', status: 'done' },
        { id: 'transform', label: 'Transform', status: 'active' },
        { id: 'load', label: 'Load', status: 'pending' },
        { id: 'notify', label: 'Notify', status: 'pending' },
      ],
      { width: w, height: h }
    );
  },
  mindMap(app, w, h) {
    return LightDraw.Diagram.mindMap(
      app,
      'LightDraw.js',
      [
        { label: 'Core Engine', children: ['Shapes', 'Renderers', 'Animation'] },
        { label: 'Modules', children: ['UI', 'Dashboard', 'Automotive'] },
        { label: 'Diagrams', children: ['Flowchart', 'Network', 'UML'] },
        { label: 'I/O', children: ['JSON', 'Export'] },
      ],
      { width: w, height: h }
    );
  },
  uml(app, w, h) {
    return LightDraw.Diagram.classDiagram(
      app,
      {
        classes: [
          {
            id: 'node',
            name: 'Node',
            x: 80,
            y: 40,
            attributes: ['- x: number', '- y: number'],
            methods: ['+ render(): void'],
          },
          {
            id: 'shape',
            name: 'Shape',
            x: 80,
            y: 200,
            methods: ['+ hitTest(): boolean'],
          },
          {
            id: 'group',
            name: 'Group',
            x: 380,
            y: 40,
            attributes: ['- children: Node[]'],
            methods: ['+ add(node): void'],
          },
        ],
        relations: [
          { from: 'shape', to: 'node', type: 'inheritance' },
          { from: 'group', to: 'node', type: 'inheritance' },
        ],
      },
      { width: w, height: h }
    );
  },
  schematic(app, w, h) {
    return LightDraw.Diagram.schematic(
      app,
      [
        { id: 'b1', type: 'battery', x: 60, y: 200, label: '9V' },
        { id: 'sw1', type: 'switch', x: 160, y: 200 },
        { id: 'r1', type: 'resistor', x: 260, y: 200, label: '220Ω' },
        { id: 'd1', type: 'led', x: 360, y: 200, label: 'LED' },
        { id: 'g1', type: 'ground', x: 460, y: 200 },
      ],
      { width: w, height: h }
    );
  },
  org(app, w, h) {
    return LightDraw.Diagram.orgChart(
      app,
      {
        name: 'CEO',
        children: [
          { name: 'CTO', children: [{ name: 'Engineering Lead' }, { name: 'QA Lead' }] },
          { name: 'CFO', children: [{ name: 'Accounting' }] },
          { name: 'COO', collapsed: true, children: [{ name: 'Operations Manager' }] },
        ],
      },
      { width: w, height: h }
    );
  },
};
