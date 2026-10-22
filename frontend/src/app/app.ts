import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<header><span class="brand">Try Not to Be Poor</span><p>Deine private Ausgabenübersicht</p></header>
    <main id="main"><router-outlet /></main>`
})
export class App {}
