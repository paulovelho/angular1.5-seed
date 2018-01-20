module PlatypusApp {
  "use strict";

  const MODULE_NAME: string = "app";
  const OTHER_MODULES: string[] = [
    "ionic"
  ];

  var module: ng.IModule = angular.module(MODULE_NAME, OTHER_MODULES);

  export const ERROR_HANDLER_SERVICE_PREFIX = "errorHandler.";

  export function Controller(controllerName: string): ClassDecorator {
    return <TFunction extends Function>(target: TFunction): TFunction => {
      module.controller(controllerName, target);
      return target;
    };
  }

  export function Service(serviceName: string): ClassDecorator {
    return <TFunction extends Function>(target: TFunction): TFunction => {
      module.service(serviceName, target);
      return target;
    };
  }

  export function ErrorHandler(...errorCodes: string[]): ClassDecorator {
    return <TFunction extends Function>(target: TFunction): TFunction => {
      errorCodes.forEach((errorCode) => {
        module.service(ERROR_HANDLER_SERVICE_PREFIX + errorCode, target);
      });
      return target;
    };
  }

  export function Directive(directiveName: string): ClassDecorator {
    return (target: ng.IDirective): void => {
      if (!angular.isArray((<any>target).$inject)) {
        (<any>target).$inject = [];
      }

      var directiveInstance: ng.IDirectiveFactory = (<any>target).$inject.concat((...injects) => { return new (<any>target)(...injects); });
      module.directive(directiveName, directiveInstance);
    };
  }

  export function Provider(providerName: string): ClassDecorator {
    return (target: ng.IServiceProvider) => {
      module.provider(providerName, target);
      return target;
    };
  }

  export function filter(name: string, targetFn: (...any) => void) {
    module.filter(name, targetFn);
  }

  export function constant(name: string, config: {}) {
    module.constant(name, config);
  }

  export function run(runFn: (...any) => void) {
    module.run(runFn);
  }

  export function config(configFn: (...any) => void) {
    module.config(configFn);
  }
}
