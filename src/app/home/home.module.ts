import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { DraggableCardComponent } from '../draggable-card/draggable-card.component';

import { HomePageRoutingModule } from './home-routing.module';

@NgModule({

  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule
  ],
  declarations: [HomePage, DraggableCardComponent],
  exports: [DraggableCardComponent]

})
export class HomePageModule {}
