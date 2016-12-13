import * as _ from 'lodash';
import * as ob from '../index';

class Module {
  constructor(public actor: ob.Actor) {
    if (actor == null) {
      ob._addModule(this);
    } else {
      actor._addModule(this);
    }
  }
}

export class DoInterval extends Module {
  ticks: number;
  isEnabled = true;

  constructor(actor: ob.Actor, public func: Function,
    public interval = 60, isStartRandomized = false,
    public isChangedByDifficulty = false) {
    super(actor);
    this.ticks = isStartRandomized ? ob.random.getInt(interval) : interval;
  }

  update() {
    this.ticks--;
    if (this.ticks <= 0) {
      if (this.isEnabled) {
        this.func(this);
      }
      let i = this.interval;
      if (this.isChangedByDifficulty) {
        i /= ob.getDifficulty();
      }
      this.ticks += i;
    }
  }
}

export class RemoveWhenOut extends Module {
  constructor(actor: ob.Actor, padding = 8,
    public paddingRight: number = null, public paddingBottom: number = null,
    public paddingLeft: number = null, public paddingTop: number = null) {
    super(actor);
    if (this.paddingRight == null) {
      this.paddingRight = padding;
    }
    if (this.paddingBottom == null) {
      this.paddingBottom = padding;
    }
    if (this.paddingLeft == null) {
      this.paddingLeft = padding;
    }
    if (this.paddingTop == null) {
      this.paddingTop = padding;
    }
  }

  update() {
    if (!ob.isIn(this.actor.pos.x, -this.paddingLeft,
      ob.screen.size.x + this.paddingRight) ||
      !ob.isIn(this.actor.pos.y, -this.paddingTop,
        ob.screen.size.y + this.paddingBottom)) {
      this.actor.remove();
    }
  }
}

export class WrapPos extends Module {
  constructor(actor: ob.Actor, public padding = 8) {
    super(actor);
  }

  update() {
    this.actor.pos.x =
      ob.wrap(this.actor.pos.x, -this.padding, ob.screen.size.x + this.padding);
    this.actor.pos.y =
      ob.wrap(this.actor.pos.y, -this.padding, ob.screen.size.y + this.padding);
  }
}

export class MoveSin extends Module {
  prop;
  angle: number;

  constructor
    (actor: ob.Actor, prop: string,
    public center = 64, public width = 48,
    public speed = 0.1, startAngle = 0) {
    super(actor);
    this.prop = getPropValue(actor, prop);
    this.prop.value[this.prop.name] = this.center;
    this.angle = startAngle;
  }

  update() {
    this.angle += this.speed;
    this.prop.value[this.prop.name] = Math.sin(this.angle) * this.width + this.center;
  }
}

export class MoveRoundTrip extends Module {
  prop;
  vel: number;

  constructor
    (actor: ob.Actor, prop: string,
    public center = 64, public width = 48,
    public speed = 1, startVel = 1) {
    super(actor);
    this.prop = getPropValue(actor, prop);
    this.prop.value[this.prop.name] = this.center;
    this.vel = startVel;
  }

  update() {
    this.prop.value[this.prop.name] += this.vel * this.speed;
    if ((this.vel > 0 && this.prop.value[this.prop.name] > this.center + this.width) ||
      (this.vel < 0 && this.prop.value[this.prop.name] < this.center - this.width)) {
      this.vel *= -1;
      this.prop.value[this.prop.name] += this.vel * this.speed * 2;
    }
  }
}

export class AbsorbPos extends Module {
  absorbingTicks = 0;

  constructor(actor: ob.Actor, public type: string = 'player', public dist = 32) {
    super(actor);
  }

  update() {
    const absorbingTos = ob.Actor.get(this.type);
    if (absorbingTos.length > 0) {
      const to = absorbingTos[0];
      if (this.absorbingTicks > 0) {
        const r = this.absorbingTicks * 0.01;
        this.actor.pos.x += (to.pos.x - this.actor.pos.x) * r;
        this.actor.pos.y += (to.pos.y - this.actor.pos.y) * r;
        this.absorbingTicks++;
      } else if (this.actor.pos.dist(to.pos) < this.dist) {
        this.absorbingTicks = 1;
      }
    }
  }
}

export class DrawText extends Module {
  constructor(actor: ob.Actor, public text: string) {
    super(actor);
  }

  update() {
    ob.text.draw(this.text, this.actor.pos.x + 1, this.actor.pos.y - 3);
  }
}

function getPropValue(obj, prop: string) {
  let value = obj;
  let name;
  const ps = prop.split('.');
  _.forEach(ps, (p, i) => {
    if (i < ps.length - 1) {
      value = value[p];
    } else {
      name = p;
    }
  });
  return { value, name };
}
