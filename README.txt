
With this app and a Systemair Z-wave adapter or a Systemair Internet access module (IAM), you can control your Systemair HVAC.

You can control the set point temperature, set the fan mode and mode.


Device: Systemair IAM Cloud

This device supports the Systemair Internett access module in "Cloud" mode.  "Modbus TCP" mode is not supported.

Triggers:

- Set point temperature was changed
- Temperature changed
- Humidity changed
- Fan mode changed
- Mode changed

Conditions:

- Fan mode is
- Mode is

Actions:

- Set temperature
- Set fan mode
- Set mode
- Initiate boost mode
- Initiate away mode
- Initiate crowded mode
- Initiate fireplace mode
- Initiate holiday mode
- Initiate refresh mode


Device: Systemair Z-wave

This devices supports the Systemair Z-wave adapter.

Triggers:

- Alarm (tokens: info)

Actions:

- Set fan mode
- Set mode
- Initiate boost mode


Acknowledgements:

Thanks to https://github.com/perara/python-systemair-savecair for communicating with the Systemair IAM.


Disclaimer:

Use at your own risk. I accept no responsibility for any damages caused by using this app.
