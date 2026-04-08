/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import {subclass, declared, property} from "esri/core/accessorSupport/decorators";

import Widget = require("esri/widgets/Widget");

import { renderable, tsx } from "esri/widgets/support/widget";

const CSS = {
  base: "esri-hello-world",
  emphasis: "esri-hello-world--emphasis"
};
@subclass("esri.widgets.HelloWorld")
class HelloWorld extends declared(Widget){
    @property()
@renderable()
firstName: string = "Martin";

@property()
@renderable()
lastName: string = "Garret";

@property()
@renderable()
isCool: boolean = true;

render() {
  const greeting = this._getGreeting();
  const classes = {
    [CSS.emphasis]: this.isCool
  };  
   return tsx(
    "div",
    { bind: this, class: CSS.base, classes: classes },
    greeting    
  );
}
// Private method
private _getGreeting(): string {
  return `Hello, my name is ${this.firstName} ${this.lastName}!`;
}
}
export = HelloWorld;