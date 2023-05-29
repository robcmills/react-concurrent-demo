import { createRef, MouseEventHandler, PureComponent } from 'react';

type Arc = {
  rotation: number;
  td: number;
};

const SPEED = 0.003 / Math.PI;
const FRAMES = 10;

export class Clock extends PureComponent {
  faceRef = createRef<SVGCircleElement>();
  arcGroupRef = createRef<SVGGElement>();
  clockHandRef = createRef<SVGPathElement>();
  frame: number | null = null;
  hitCounter = 0;
  rotation = 0;
  t0 = Date.now();
  arcs: Arc[] = [];

  animate = () => {
    const now = Date.now();
    const td = now - this.t0;
    this.rotation = (this.rotation + SPEED * td) % (2 * Math.PI);
    this.t0 = now;

    this.arcs.push({ rotation: this.rotation, td });

    let lx = 0;
    let ly = 0;
    let tx = 0;
    let ty = 0;
    if (this.arcs.length > FRAMES) {
      this.arcs.forEach(({rotation, td}, i) => {
        lx = tx;
        ly = ty;
        const r = 145;
        tx = 155 + r * Math.cos(rotation);
        ty = 155 + r * Math.sin(rotation);
        const bigArc = SPEED * td < Math.PI ? '0' : '1';
        const path = `M${tx} ${ty}A${r} ${r} 0 ${bigArc} 0 ${lx} ${ly}L155 155`;
        const hue = 120 - Math.min(120, td / 4);
        const colour = `hsl(${hue}, 100%, ${60 - i * (30 / FRAMES)}%)`;
        if (i !== 0) {
          // @ts-expect-error looks like some legacy unsafe indexing into children?
          const arcEl = this.arcGroupRef.current.children[i - 1];
          arcEl.setAttribute('d', path);
          arcEl.setAttribute('fill', colour);
        }
      });
      this.clockHandRef.current?.setAttribute('d', `M155 155L${tx} ${ty}`);
      this.arcs.shift();
    }

    if (this.hitCounter > 0) {
      this.faceRef.current?.setAttribute(
        'fill',
        `hsla(0, 0%, ${this.hitCounter}%, 0.95)`
      );
      this.hitCounter -= 1;
    } else {
      this.hitCounter = 0;
      this.faceRef.current?.setAttribute('fill', 'hsla(0, 0%, 5%, 0.95)');
    }

    this.frame = requestAnimationFrame(this.animate);
  };

  componentDidMount() {
    this.frame = requestAnimationFrame(this.animate);
    if (this.faceRef.current) {
      this.faceRef.current.addEventListener('click', this.handleEventListenerClick);
    }
  }

  componentDidUpdate() {
    console.log('componentDidUpdate()', this.faceRef.current);
  }

  componentWillUnmount() {
    this.faceRef.current?.removeEventListener('click', this.handleEventListenerClick);
    if (this.frame) {
      cancelAnimationFrame(this.frame);
    }
  }

  handleEventListenerClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.hitCounter = 50;
  };

  handleReactClick: MouseEventHandler<SVGCircleElement> = event => {
    event.stopPropagation();
    this.hitCounter = 50;
  };

  render() {
    const paths = new Array(FRAMES);
    for (let i = 0; i < FRAMES; i++) {
      paths.push(<path className="arcHand" key={i} />);
    }
    return (
      <div className="stutterer">
        <svg height="310" width="310">
          <circle
            className="clockFace"
            onClick={this.handleReactClick}
            cx={155}
            cy={155}
            r={150}
            ref={this.faceRef}
          />
          <g ref={this.arcGroupRef}>{paths}</g>
          <path className="clockHand" ref={this.clockHandRef} />
        </svg>
      </div>
    );
  }
}
