jQuery.sap.declare("PES.Common.Control.ColorfulTextField");
jQuery.sap.require("sap.ui.commons.TextField");
/**
 * This TextField has been created to set specifig background colors and text colors.
 * In case, no text color is given, this control calculates a fitting text color by
 * taking the brightness in to count.
 * Color codes are given as HEX values. This could change in future due to usage of sap.ui.core.CSSColor.
 *
 * Changelog:
 * 2015-03-27	PHIGEM	1.0	Initial creation of control.
 * 2015-03-30	PHIGEM	1.1	Extend control to calculate texdt color depending on background color. Add default aggregation "tooltip".
 * 2015-04-13	PHIGEM	1.2	Color values are given as type sap.ui.core.CSSColor to prevent XSS. See https://openui5beta.hana.ondemand.com/#docs/guide/4de64e2e191f4a7297d4fd2d1e233a2d.html
 * 2015-07-10	PHIGEM	1.3	Added support for border color
 * 2015-07-13	PHIGEM	1.4	Added support highlighted attribute. Clean up some code.
 */
sap.ui.commons.TextField.extend("PES.Common.Control.ColorfulTextField", {

    //Add new properties to the control.
    //You can bin any value to those properties, just like any other property
    metadata: {
        //Component Version
        version: "1.4",

        defaultAggregation: "tooltip",

        //Attach color properties
        //UI5 will automatically generate getter and setter functions
        properties: {
            highlighted: {
                type: "boolean",
                defaultValue: false
            },
            myBorderColor: { //Die Rahmenfarbe, die in das Feld gerendert werden soll. Rahmen wird per default als 1px solid gerendert.
                type: "sap.ui.core.CSSColor"
            },
            myBackgroundColor: { //Die Hintergrundfarbe, die in das Feld gerendert werden soll
                type: "sap.ui.core.CSSColor"
            },
            myTextColor: { //optional: die Textfarbe die gerendert werden soll. Wenn nicht angegeben, wird die Textfarbe errechnet (siehe _calculateTextColor)
                type: "sap.ui.core.CSSColor"
            },
            myTextColorWhenBackgroundDark: { //optional: die Textfarbe, wenn der Hintergrund dunkel ist
                type: "sap.ui.core.CSSColor",
                defaultValue: "#000000"
            },
            myTextColorWhenBackgroundBright: { //optional: die Textfarbe, wenn der Hintergrund hell ist
                type: "sap.ui.core.CSSColor",
                defaultValue: "#FFFFFF"
            },
            myTextColorBrightnessTreshhold: { //optional: Grenzwert mit dem entschieden wird, ob eine Hintergrundfarbe hell oder dunkel ist
                type: "int",
                defaultValue: 127
            },
            myRFactor: { //optional: Rot-Faktor aus RGB Farbraum um die Helligkeit zu bestimmen
                type: "float",
                defaultValue: 0.2126
            },
            myGFactor: { //optional: Gelb-Faktor aus RGB Farbraum um die Helligkeit zu bestimmen
                type: "float",
                defaultValue: 0.7152
            },
            myBFactor: { //optional: Blau-Faktor aus RGB Farbraum um die Helligkeit zu bestimmen
                type: "float",
                defaultValue: 0.0722
            }
        }

    },

    //Now we modify the renderer to set background color and text color
    //ans border color
    renderer: {
        renderInnerAttributes: function(oRm, oControl) {

            //Lets do some checks
            if (oControl.getHighlighted() &&
                (oControl.getMyBackgroundColor() || oControl.getMyBorderColor())) {
                jQuery.sap.log.warning("highlighted and myBackgroundColor/myBorderColor is set! Therefore, myBackgroundColor and myBorderColor is ignored.", "You can only set attr highligthed or specify background color / border color. Do not set both at the same time.", oControl.getId()); //jQuery.sap.log.warning(sMessage, sDetails?, sComponent?) Creates a new warning-level entry in the log with the given message, details and calling component.
            }

            if (oControl.getHighlighted()) {
                oRm.addClass("sapUiHighlightedInputStyle"); //css class is set to !important
                oRm.writeClasses();

                return true; //return to avoid further colorization
            }

            try {
                //Get Border Color from metadata property
                var borderColor = oControl.getMyBorderColor();
                if (borderColor) {
                    //Check if color string is a valid hex code
                    if (oControl._checkColorCode(borderColor)) {
                        //Set border color
                        oRm.addStyle('border-color', borderColor);
                        //Set border style defaults
                        oRm.addStyle('border-style', 'solid');
                        oRm.addStyle('border-width', '1px');
                    } else {
                        jQuery.sap.log.warning("Setting border color failed. " + borderColor + " is not a valid Hex color code!", "Use colorcode according to \'#RRGGBB\'", oControl.getId());
                    }
                }
            } catch (e) {
                throw "Error during rendering of InnerAttribute \'border-color\' within PES.Common.Control.ColorfulTextField: " + e.message;
            }

            try {
                //Get Background Color from metadata property
                var backgroundColor = oControl.getMyBackgroundColor();
                if (backgroundColor) {
                    //Check if color string is a valid hex code
                    if (oControl._checkColorCode(backgroundColor)) {
                        //Set background color
                        oRm.addStyle('background-color', backgroundColor);
                    } else {
                        jQuery.sap.log.warning("Setting background color failed. " + backgroundColor + " is not a valid Hex color code!", "Use colorcode according to \'#RRGGBB\'", oControl.getId());
                    }
                }
            } catch (e) {
                throw "Error during rendering of InnerAttribute \'background-color\' within PES.Common.Control.ColorfulTextField: " + e.message;
            }

            try {
                //Get Text Color from metadata property. If no Text Color is defined, we calculate its value by Background Color
                var textColor = oControl.getMyTextColor();
                if (textColor) {
                    //Check if color string is a valid hex code
                    if (oControl._checkColorCode(textColor)) {
                        //Set text color
                        oRm.addStyle('color', textColor);
                    } else {
                        jQuery.sap.log.warning("Setting text color failed. " + textColor + " is not a valid Hex color code!", "Use colorcode according to \'#RRGGBB\'", oControl.getId());
                    }

                } else {
                    if (backgroundColor && oControl._checkColorCode(backgroundColor)) {
                        oRm.addStyle('color', oControl._calculateTextColor(backgroundColor, oControl));
                    } else {
                        jQuery.sap.log.info("No background color or text color set for " + oControl.getId());
                    }
                }

            } catch (e) {
                throw "Error during rendering of InnerAttribute \'color\' within PES.Common.Control.ColorfulTextField: " + e.message;
            }
        }
    },

    //calculate text color depending on background color brightness
    //If background color is "bright", function retruns white
    //If background color is "dark", function retruns black
    _calculateTextColor: function(sBackgroundColor, oControl) {
        try {
            var r = parseInt(sBackgroundColor.substr(1, 2), 16) / 255;
            var g = parseInt(sBackgroundColor.substr(3, 2), 16) / 255;
            var b = parseInt(sBackgroundColor.substr(5, 2), 16) / 255;

            var brightness = (oControl.getMyRFactor() * r) + (oControl.getMyGFactor() * g) + (oControl.getMyBFactor() * b);
            brightness = brightness * 255;

            if (brightness > oControl.getMyTextColorBrightnessTreshhold()) {
                return oControl.getMyTextColorWhenBackgroundDark();
            } else {
                return oControl.getMyTextColorWhenBackgroundBright();
            }
        } catch (e) {
            throw "Error during calculateion of text color within PES.Common.Control.ColorfulTextField: " + e.message;
        }
    },

    _checkColorCode: function(sColorCode) {
        var hexColorPattern = new RegExp("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");
        return hexColorPattern.test(sColorCode);
    }
});