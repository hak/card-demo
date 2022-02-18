import { Prop, Host, h, writeTask } from '@stencil/core';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { createGesture, Gesture } from '@ionic/core';
import {
  AnimationController,
  GestureController,
  IonCard,
} from '@ionic/angular';

interface Vec2D {
  x: number;
  y: number;
}

@Component({
  selector: 'app-draggable-card',
  templateUrl: './draggable-card.component.html',
  styleUrls: ['./draggable-card.component.scss'],
})
export class DraggableCardComponent implements OnInit {
  constructor(
    private el: ElementRef,
    private gestureCtrl: GestureController,
    private animationCtrl: AnimationController
  ) {}

  card = null;
  offset: Vec2D = { x: 0, y: 0 };
  rotation = 0;

  rotatedOrigin: Vec2D = { x: 0, y: 0 };
  normalizedMassCenterToClick: Vec2D = { x: 0, y: 0 };
  distanceToClick = 0;

  ngOnInit() {
    const debug = false;
    this.card = document.querySelector('.card-box');

    const gesture = this.gestureCtrl.create({
      el: this.card,
      threshold: 0,
      onStart: (ev) => {
        let rect = this.card.parentElement.getBoundingClientRect();
        // Parent rect's offset.
        this.offset.x = rect.left;
        this.offset.y = rect.top;

        rect = this.card.getBoundingClientRect();
        const centerOfElement: Vec2D = { x: 0, y: 0 };
        centerOfElement.x = rect.left + rect.width / 2;
        centerOfElement.y = rect.top + rect.height / 2;

        const vectorToRotationOrigin: Vec2D = { x: 0, y: 0 };
        vectorToRotationOrigin.x =
          this.rotatedOrigin.x - this.card.offsetWidth / 2;
        vectorToRotationOrigin.y =
          this.rotatedOrigin.y - this.card.offsetHeight / 2;

        const rotatedOrigin = this.rotate(
          vectorToRotationOrigin,
          this.rotation
        );

        const projectedOrign: Vec2D = {
          x: centerOfElement.x + rotatedOrigin.x,
          y: centerOfElement.y + rotatedOrigin.y,
        };

        const vecClickToOrigin: Vec2D = {
          x: projectedOrign.x - ev.startX,
          y: projectedOrign.y - ev.startY,
        };
        const rotatedClick = this.rotate(vecClickToOrigin, -this.rotation);
        this.rotatedOrigin.x += -rotatedClick.x;
        this.rotatedOrigin.y += -rotatedClick.y;

        this.offset.x += this.rotatedOrigin.x;
        this.offset.y += this.rotatedOrigin.y;

        const vecMassCenterToClick = {
          x: this.rotatedOrigin.x - this.card.offsetWidth / 2,
          y: this.rotatedOrigin.y - this.card.offsetHeight / 2,
        };
        this.normalizedMassCenterToClick = this.normalize(vecMassCenterToClick);
        this.distanceToClick = this.magnitude(vecMassCenterToClick);

        if (debug) {
          console.log(ev);
          console.log(
            'CenterOfElement:' + centerOfElement.x + ' ' + centerOfElement.y
          );

          console.log(
            'VecToRotOigin:' +
              vectorToRotationOrigin.x +
              ' ' +
              vectorToRotationOrigin.y
          );
          console.log(
            'rotation:' +
              this.rotation +
              ' rotatedOrigin:' +
              rotatedOrigin.x +
              ' ' +
              rotatedOrigin.y
          );
          console.log(
            'projectedOrign:' + projectedOrign.x + ' ' + projectedOrign.y
          );
          console.log(
            'vecClickToOrign:' + vecClickToOrigin.x + ' ' + vecClickToOrigin.y
          );
          console.log('rotatedClick:' + rotatedClick.x + ' ' + rotatedClick.y);
          console.log('offset:' + this.offset.x + ' ' + this.offset.y);
        }

        const style = this.card.style;
        writeTask(() => {
          this.applyTransformOrigin(
            style,
            `${this.rotatedOrigin.x}px ${this.rotatedOrigin.y}px`
          );
          this.applyTransform(
            style,
            `translate(${ev.currentX - this.offset.x}px, ${
              ev.currentY - this.offset.y
            }px) rotate(${this.rotation}deg)`
          );
        });
      },
      onMove: (detail) => {
        this.onMove(detail);
      },
      gestureName: '',
    });

    gesture.enable();
  }

  applyTransform(style, transform) {
    style.webkitTransform = transform;
    style.mozTransform = transform;
    style.transform = transform;
  }

  applyTransformOrigin(style, origin) {
    style.webkitTransformOrigin = origin;
    style.mozTransformOrigin = origin;
    style.transformOrigin = origin;
  }

  rotate(v: Vec2D, r: number): Vec2D {
    const sin = Math.sin(r * (Math.PI / 180));
    const cos = Math.cos(r * (Math.PI / 180));
    const ret: Vec2D = { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
    return ret;
  }

  magnitude(v: Vec2D) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  normalize(v: Vec2D) {
    const mag = this.magnitude(v);
    if (mag == 0) {
      v = { x: 0, y: 0 };
      return v;
    }
    v = { x: v.x / mag, y: v.y / mag };
    return v;
  }

  onMove(ev) {
    // Physics simulation.
    const vecVelocity = { x: ev.velocityX, y: ev.velocityY };
    const rotatedVelocity = this.rotate(vecVelocity, -this.rotation);

    const normalizedVelocity = this.normalize(rotatedVelocity);
    const dot =
      normalizedVelocity.x * this.normalizedMassCenterToClick.x +
      normalizedVelocity.y * this.normalizedMassCenterToClick.y;

    const outerProduct =
      normalizedVelocity.x * this.normalizedMassCenterToClick.y -
      normalizedVelocity.y * this.normalizedMassCenterToClick.x;
    const f = Math.sin(dot);
    const torqueVec = { x: rotatedVelocity.x * f, y: rotatedVelocity.y * f };
    const torqueMag = this.magnitude(torqueVec);

    // 100: magnificatoin factor.
    let torque = (torqueMag * this.distanceToClick) / 100;
    if (outerProduct > 0) {
      torque = -torque;
    }

    const debug = false;
    if (debug) {
      console.log(ev);

      console.log(
        'rotatedOrigin:' + this.rotatedOrigin.x + ' ' + this.rotatedOrigin.y
      );
      console.log(
        'rotatedVelocity:' + rotatedVelocity.x + ' ' + rotatedVelocity.y
      );
      console.log(
        'normalizedVelocity:' +
          normalizedVelocity.x +
          ' ' +
          normalizedVelocity.y
      );
      console.log(
        'normalizedMassCenterToClick:' +
          this.normalizedMassCenterToClick.x +
          ' ' +
          this.normalizedMassCenterToClick.y
      );
      console.log('outerprod:' + outerProduct);
      console.log('dot:' + dot);
      console.log('torque:' + torque);
    }

    this.rotation += torque;

    const style = this.card.style;
    writeTask(() => {
      //
      // position : currentPos - parentPos - offset
      //
      this.applyTransform(
        style,
        `translate(${ev.currentX - this.offset.x}px, ${
          ev.currentY - this.offset.y
        }px) rotate(${this.rotation}deg)`
      );
    });
  }
}
