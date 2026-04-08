/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "./esri/core/accessorSupport/decorators/*", "./esri/widgets", "./esri/widgets/support/widget"], function (require, exports, __extends, __decorate, _1, Widget, widget_1) {
    "use strict";
    var CSS = {
        base: "esri-hello-world",
        emphasis: "esri-hello-world--emphasis"
    };
    var HelloWorld = /** @class */ (function (_super) {
        __extends(HelloWorld, _super);
        function HelloWorld() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.firstName = "Martin";
            _this.lastName = "Garret";
            _this.isCool = true;
            return _this;
        }
        HelloWorld.prototype.render = function () {
            var _a;
            var greeting = this._getGreeting();
            var classes = (_a = {},
                _a[CSS.emphasis] = this.isCool,
                _a);
            return (0, widget_1.tsx)("div", { bind: this, class: CSS.base, classes: classes }, greeting);
        };
        // Private method
        HelloWorld.prototype._getGreeting = function () {
            return "Hello, my name is ".concat(this.firstName, " ").concat(this.lastName, "!");
        };
        __decorate([
            (0, _1.property)(),
            (0, widget_1.renderable)()
        ], HelloWorld.prototype, "firstName", void 0);
        __decorate([
            (0, _1.property)(),
            (0, widget_1.renderable)()
        ], HelloWorld.prototype, "lastName", void 0);
        __decorate([
            (0, _1.property)(),
            (0, widget_1.renderable)()
        ], HelloWorld.prototype, "isCool", void 0);
        HelloWorld = __decorate([
            (0, _1.subclass)("esri.widgets.HelloWorld")
        ], HelloWorld);
        return HelloWorld;
    }((0, _1.declared)(Widget)));
    return HelloWorld;
});
//# sourceMappingURL=HelloWorld.js.map