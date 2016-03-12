jQuery.sap.require("sap.ui.commons.TextView");
jQuery.sap.declare("PES.Common.Control.ColorfulTextView");
/**
 * This TextView has been created to set specific background colors and text colors.
 * In case, no text color is given, this control calculates a fitting text color by
 * taking the brightness in to count.
 */
sap.ui.commons.TextView.extend("PES.Common.Control.ColorfulTextView",
{
   // Add two new properties to the control.
   // You can bin any value to those properties, just like any other property
   metadata:
   {
      // Component Version
      version: "1.1",

      // Lets play around with some nice UI5 features and attach a config object
      defaultAggregation: "tooltip",

      // Attach color properties
      // UI5 will automatically generate getter and setter functions
      properties:
      {
         myBackgroundColor:
         { // Die Hintergrundfarbe, die in das Feld gerendert werden soll
            type: "string"
         },
         myTextColor:
         { // Optional: die Textfarbe, die gerendert werden soll. Wenn nicht angegeben, wird die Textfarbe errechnet (siehe calculateTextColor)
            type: "string"
         },
         myTextColorWhenBackgroundDark:
         { // Optional: die Textfarbe, wenn der Hintergrund dunkel ist
            type: "string",
            defaultValue: "#000000"
         },
         myTextColorWhenBackgroundBright:
         { // Optional: die Textfarbe, wenn der Hintergrund hell ist
            type: "string",
            defaultValue: "#FFFFFF"
         },
         myTextColorBrightnessTreshhold:
         { // Optional: Grenzwert, mit dem entschieden wird, ob eine Hintergrundfarbe hell oder dunkel ist
            type: "int",
            defaultValue: 127
         },
         myRFactor:
         { // Optional: Rot-Faktor aus RGB Farbraum, um die Helligkeit zu bestimmen
            type: "float",
            defaultValue: 0.2126
         },
         myGFactor:
         { // Optional: Gelb-Faktor aus RGB Farbraum, um die Helligkeit zu bestimmen
            type: "float",
            defaultValue: 0.7152
         },
         myBFactor:
         { //Optional : Blau-Faktor aus RGB Farbraum, um die Helligkeit zu bestimmen
            type: "float",
            defaultValue: 0.0722
         }
      }

   },

   // Now we modify the renderer to set background color and text color
   renderer:
   {
      renderInnerAttributes: function(oRm, oControl)
      {
         try
         {
            // Get Background Color from metadata property
            var backgroundColor = oControl.getMyBackgroundColor();
            if (backgroundColor == undefined || backgroundColor == null)
            {
               return;
            }

            // Check if color string is a valid hex code
            if (oControl.checkColorCode(backgroundColor))
            {
               // Set background color
               oRm.addStyle('background-color', backgroundColor);
            }
            else
            {
               jQuery.sap.log.warning("Setting background color failed. " + backgroundColor + " is not a valid Hex color code!");
               return;
            }

            // Get Text Color from metadata property. If no Text Color is defined, we calculate its value by Background Color
            var textColor = oControl.getMyTextColor();
            if (textColor == undefined || textColor == null)
            {
               oRm.addStyle('color', oControl.calculateTextColor(backgroundColor, oControl));
            }
            else
            {
               oRm.addStyle('color', textColor);
            }
         }
         catch (e)
         {
            throw "Error during rendering of InnerAttributes within PES.Common.Control.ColorfulTextField: " + e.message;
         }
      }

   },

   // Calculate text color depending on background color brightness
   // If background color is "bright", function retruns white
   // If background color is "dark", function retruns black
   calculateTextColor: function(sBackgroundColor, oControl)
   {
      try
      {
         var r = parseInt(sBackgroundColor.substr(1, 2), 16) / 255;
         var g = parseInt(sBackgroundColor.substr(3, 2), 16) / 255;
         var b = parseInt(sBackgroundColor.substr(5, 2), 16) / 255;

         var brightness = (oControl.getMyRFactor() * r) + (oControl.getMyGFactor() * g) + (oControl.getMyBFactor() * b);
         brightness = brightness * 255;

         if (brightness > oControl.getMyTextColorBrightnessTreshhold())
         {
            return oControl.getMyTextColorWhenBackgroundDark();
         }
         else
         {
            return oControl.getMyTextColorWhenBackgroundBright();
         }
      }
      catch (e)
      {
         throw "Error during calculateion of text color within PES.Common.Control.ColorfulTextField: " + e.message;
      }
   },

   checkColorCode: function(sColorCode)
   {
      var hexColorPattern = new RegExp("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");
      return hexColorPattern.test(sColorCode);
   }
});