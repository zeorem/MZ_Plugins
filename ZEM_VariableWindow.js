/*:
 * @target MZ
 * @plugindesc Shows a variable in a window at the start of battle scene.
 * @author Zeorem
 *
 * @param VariableID
 * @text Variable ID
 * @type variable
 * @desc The game variable to display in the window.
 * @default 1
 *
 */

(() => {
    'use strict'
    
    const PARAMETERS = PluginManager.parameters("ZEM_VariableWindow");
    const variableId = Number(PARAMETERS["VariableID"] || 1);

    class Window_BattleVariable extends Window_Base {
        constructor(rect) {
            super(rect);
            this.refresh();
        }

        refresh() {
            this.contents.clear();
            const value = $gameVariables.value(variableId);
            this.drawText(`${value}`, 0, 0, this.contents.width, "right");
            this.drawIcon(303, 0, 0);
        }
    }
    
    const ZEM_VW_Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        ZEM_VW_Scene_Battle_createAllWindows.call(this);
        const rect = this.zemVariableWindowRect();
        this._battleVariableWindow = new Window_BattleVariable(rect);
        this._battleVariableWindow.hide();
        
        this.addWindow(this._battleVariableWindow);
    };

    const ZEM_VW_Scene_Battle_startPartyCommandSelection =  Scene_Battle.prototype.startPartyCommandSelection;
    Scene_Battle.prototype.startPartyCommandSelection = function() {
        ZEM_VW_Scene_Battle_startPartyCommandSelection.call(this);
        this._battleVariableWindow.hide();
    }

    const ZEM_VW_Scene_Battle_startActorCommandSelection =  Scene_Battle.prototype.startActorCommandSelection;
    Scene_Battle.prototype.startActorCommandSelection = function() {
        ZEM_VW_Scene_Battle_startActorCommandSelection.call(this);
        this._battleVariableWindow.show();
    }

    const ZEM_VW_Scene_Battle_endCommandSelection =  Scene_Battle.prototype.endCommandSelection;
    Scene_Battle.prototype.endCommandSelection = function() {
        ZEM_VW_Scene_Battle_endCommandSelection.call(this);
        this._battleVariableWindow.hide();
    }

    Scene_Battle.prototype.zemVariableWindowRect = function() {
        const ww = 100;
        const wh = 60;
        const wx = (Graphics.boxWidth - ww) / 2;
        const wy = 0;
        return new Rectangle(wx, wy, ww, wh);
    };

})();
