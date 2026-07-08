sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/core/message/MessageManager",
    "rlbudget/model/models"
], function (UIComponent, MessageManager, models) {
    "use strict";
    return UIComponent.extend("rlbudget.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },
        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.setModel(models.createDeviceModel(), "device");
            var oMessageManager = MessageManager;
            this.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(this.getRootControl(), true);
            this.getRouter().initialize();
        },
        destroy: function () {
            MessageManager.unregisterObject(this.getRootControl());
            UIComponent.prototype.destroy.apply(this, arguments);
        }
    });
});