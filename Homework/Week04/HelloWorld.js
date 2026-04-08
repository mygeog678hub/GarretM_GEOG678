/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import { renderable } from "esri/widgets/support/widget";
const CSS = {
    base: "esri-hello-world",
    emphasis: "esri-hello-world--emphasis"
};
let HelloWorld = (() => {
    let _classDecorators = [subclass("esri.widgets.HelloWorld")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = declared(Widget);
    let _firstName_decorators;
    let _firstName_initializers = [];
    let _firstName_extraInitializers = [];
    let _lastName_decorators;
    let _lastName_initializers = [];
    let _lastName_extraInitializers = [];
    let _isCool_decorators;
    let _isCool_initializers = [];
    let _isCool_extraInitializers = [];
    var HelloWorld = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _firstName_decorators = [property(), renderable()];
            _lastName_decorators = [property(), renderable()];
            _isCool_decorators = [property(), renderable()];
            __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: obj => "firstName" in obj, get: obj => obj.firstName, set: (obj, value) => { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
            __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: obj => "lastName" in obj, get: obj => obj.lastName, set: (obj, value) => { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
            __esDecorate(null, null, _isCool_decorators, { kind: "field", name: "isCool", static: false, private: false, access: { has: obj => "isCool" in obj, get: obj => obj.isCool, set: (obj, value) => { obj.isCool = value; } }, metadata: _metadata }, _isCool_initializers, _isCool_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HelloWorld = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        firstName = __runInitializers(this, _firstName_initializers, "Martin");
        lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, "Garret"));
        isCool = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _isCool_initializers, true));
        render() {
            const greeting = this._getGreeting();
            const classes = {
                [CSS.emphasis]: this.isCool
            };
            return (<div bind={this} className={CSS.base} classes={classes}>
    {greeting}
    </div>);
        }
        // Private method
        _getGreeting() {
            return `Hello, my name is ${this.firstName} ${this.lastName}!`;
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _isCool_extraInitializers);
        }
    };
    return HelloWorld = _classThis;
})();
