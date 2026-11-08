# Doc2FAQ v0.5.0 — Windows quick start

1. Extract the **entire** `Doc2FAQ-0.5.0-Windows.zip` to a folder. Do not launch it while still inside the ZIP.
2. Install Java 21–26 if needed. In Command Prompt, run `java -version` to confirm it works. The app targets Java 21 bytecode. Java 27 had an exploratory successful test but is not part of the official v0.5.0 compatibility matrix.
3. Double-click `Start-Doc2FAQ.cmd`. A terminal window explains that the app is starting and stays open while the server is running.
4. Open [http://localhost:8080](http://localhost:8080) in your browser after Java has started.
5. Close the terminal or press **Ctrl+C** when you are finished.

If Windows blocks an unfamiliar downloaded script, do not disable Windows protections. You can instead open Command Prompt in the extracted folder and run:

```cmd
java -jar doc2faq-0.5.0.jar
```

If port 8080 is already used, stop the older Doc2FAQ process or run:

```cmd
java -jar doc2faq-0.5.0.jar --server.port=8081
```

Then open [http://localhost:8081](http://localhost:8081).

The app processes documents locally. For a browser-only demo without a Java installation, visit [the Doc2FAQ project page](https://okantiktas.com/projects/doc2faq/).

To verify a downloaded artifact, compare its SHA-256 hash against `SHA256SUMS.txt` in the same GitHub release.
