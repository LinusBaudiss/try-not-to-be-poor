import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { Session } from './session/session';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `<header><span class="brand">Try Not to Be Poor</span><p>Deine private Ausgabenübersicht</p>
      @if (session.userId()) { <nav aria-label="Hauptnavigation"><a routerLink="/monat" routerLinkActive="active" ariaCurrentWhenActive="page">Monat</a><a routerLink="/sparziele" routerLinkActive="active" ariaCurrentWhenActive="page">Sparziele</a></nav> }
    </header>
    <main id="main"><router-outlet /></main>`
})
export class App { protected readonly session = inject(Session); }
