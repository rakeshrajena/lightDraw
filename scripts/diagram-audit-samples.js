/** Shared diagram samples for audit screenshots */
window.DIAGRAM_AUDIT_SAMPLES = {
  flowchart(app, w, h) {
    return LightDraw.Diagram.flowchart(
      app,
      {
        nodes: [
          { id: 'start', label: 'Start', type: 'start', x: 384, y: 24 },
          { id: 'check', label: 'Valid input?', type: 'decision', x: 384, y: 110 },
          { id: 'process', label: 'Process data', x: 384, y: 210 },
          { id: 'end', label: 'Complete', type: 'end', x: 384, y: 300 },
        ],
        edges: [
          { from: 'start', to: 'check' },
          { from: 'check', to: 'process', label: 'yes' },
          { from: 'check', to: 'end', label: 'no' },
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
          { id: 'init', label: '', type: 'initial', x: 40, y: 211 },
          { id: 'idle', label: 'Idle', x: 100, y: 200 },
          { id: 'load', label: 'Loading', x: 300, y: 80 },
          { id: 'run', label: 'Running', x: 500, y: 200 },
          { id: 'err', label: 'Error', x: 300, y: 340 },
          { id: 'done', label: 'Done', type: 'final', x: 700, y: 200 },
        ],
        transitions: [
          { from: 'init', to: 'idle' },
          { from: 'idle', to: 'load', label: 'fetch' },
          { from: 'load', to: 'run', label: 'ok' },
          { from: 'load', to: 'err', label: 'fail' },
          { from: 'run', to: 'done', label: 'complete' },
          { from: 'err', to: 'load', label: 'retry' },
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
      {
        width: w,
        height: h,
        x: 0,
        y: 80,
        flow: {
          enabled: true,
          mode: 'both',
          playback: 'loop',
          statusHighlight: true,
          paths: [
            ['ecm', 'tcu', 'abs'],
            ['bcm', 'icu', 'ecm'],
          ],
          pathGapMs: 550,
          chrome: false,
        },
      }
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
            x: 340,
            y: 36,
            attributes: ['- x: number', '- y: number'],
            methods: ['+ render(): void'],
          },
          {
            id: 'shape',
            name: 'Shape',
            x: 120,
            y: 260,
            attributes: ['- fill: string'],
            methods: ['+ hitTest(): boolean'],
          },
          {
            id: 'group',
            name: 'Group',
            x: 560,
            y: 260,
            attributes: ['- children: Node[]'],
            methods: ['+ add(node): void'],
          },
        ],
        relations: [
          { from: 'shape', to: 'node', type: 'inheritance' },
          { from: 'group', to: 'node', type: 'inheritance' },
          { from: 'group', to: 'shape', type: 'composition' },
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
        name: 'Alex Rivera',
        role: 'CEO',
        department: 'Executive',
        image: 'https://api.dicebear.com/9.x/notionists/svg?seed=AlexRivera&backgroundColor=1e3a5f',
        children: [
          {
            name: 'Sam Chen',
            role: 'CTO',
            department: 'Engineering',
            image: 'https://api.dicebear.com/9.x/notionists/svg?seed=SamChen&backgroundColor=1e1b4b',
            children: [
              { name: 'Jordan Lee', role: 'Eng Lead', department: 'Platform' },
              { name: 'Riley Park', role: 'QA Lead', department: 'Quality' },
            ],
          },
          {
            name: 'Morgan Blake',
            role: 'CFO',
            department: 'Finance',
            image: 'https://api.dicebear.com/9.x/notionists/svg?seed=MorganBlake&backgroundColor=3b0764',
            children: [{ name: 'Casey Ng', role: 'Accounting', department: 'Finance' }],
          },
          {
            name: 'Taylor Kim',
            role: 'COO',
            department: 'Operations',
            image: 'https://api.dicebear.com/9.x/notionists/svg?seed=TaylorKim&backgroundColor=0f172a',
            children: [{ name: 'Avery Brooks', role: 'Ops Manager', department: 'Operations' }],
          },
        ],
      },
      { width: w, height: h }
    );
  },
};
