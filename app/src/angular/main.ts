import "@angular/compiler";
import { Component, provideZonelessChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import "../styles.css";

@Component({
  selector: "app-root",
  template: "<main><h1>Hello world</h1></main>",
})
class AppComponent {}

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
});
