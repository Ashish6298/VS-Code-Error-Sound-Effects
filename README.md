# Error Sound Alert 🎵

**Error Sound Alert** is a Visual Studio Code extension designed to provide immediate audible feedback for your coding workspace. It helps you catch errors the moment they happen without needing to look at the Problems panel or Terminal.

## Features

- **Code Error Monitoring**: Automatically plays a sound whenever a new error (red squiggly) appears in your code.
- **Terminal Error Detection**: Alerts you when a terminal command fails with a non-zero exit code.
- **Sound Dashboard**: A dedicated sidebar with a sleek Sound Library to manage your alerts.
- **Sound Library**: 
  - **Upload** your own audio files (MP3, WAV, etc.).
  - **Preview** sounds directly from the sidebar.
  - **Select** your favorite alert with a single click.
- **Power Control**: Easily toggle the extension on or off with a master "Extension Status" switch in the sidebar.
- **Smart Logic**: Prevents audio spam using signature-based diagnostic diffing and configurable cooldowns.

## How to Use

1. **Activate**: Click the **Speaker Icon** in the Activity Bar on the far left.
2. **Setup**: The extension comes with a high-quality default sound (`mallikgalti.mp3`).
3. **Customize**: 
   - Use the **"+ Add Sound"** button in the sidebar to add your own MP3 files.
   - Click the checkmark next to your favorite sound to make it active.
4. **Go!**: Type an error or run a failing command in the terminal to hear the alert.

## Extension Settings

This extension contributes the following settings:

* `errorSoundAlert.enabled`: Enable/disable all audio alerts.
* `errorSoundAlert.triggerOnTerminalError`: Toggle sounds for terminal command failures.
* `errorSoundAlert.volume`: Control the playback volume (0.0 to 1.0).
* `errorSoundAlert.cooldownMs`: Prevent repeating sounds too quickly (default 500ms).

## License

This project is licensed under the MIT License.

---

### Author
**Ashish Goswami**  
- [GitHub](https://github.com/Ashish6298)  
- [LinkedIn](https://www.linkedin.com/in/ashish-goswami-58797a24a/)
