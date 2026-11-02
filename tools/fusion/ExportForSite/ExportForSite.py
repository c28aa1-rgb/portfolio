"""Fusion script: export the open design for the resume site.

Writes into <Resume Site>/public/media/fusion/:
  <name>.3mf          the full model (for tools/render-3mf.mjs line drawings)
  <name>-iso.png      a 2400x1800 isometric render
  <name>-top.png      a top-down render
  <name>.json         component and body counts, size in mm
"""
import json
import os
import re
import traceback

import adsk.core
import adsk.fusion

SITE = os.path.expanduser("~/Downloads/Resume Site")


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "design"


def render(app, path, orientation):
    viewport = app.activeViewport
    camera = viewport.camera
    camera.viewOrientation = orientation
    camera.isFitView = True
    viewport.camera = camera
    viewport.refresh()
    try:
        options = adsk.core.SaveImageFileOptions.create(path)
        options.width, options.height = 2400, 1800
        options.isBackgroundTransparent = True
        options.isAntiAliased = True
        viewport.saveAsImageFileWithOptions(options)
    except Exception:
        viewport.saveAsImageFile(path, 2400, 1800)


def run(context):
    app = adsk.core.Application.get()
    ui = app.userInterface
    try:
        design = adsk.fusion.Design.cast(app.activeProduct)
        if not design:
            ui.messageBox("Open a design first, then run this script.")
            return

        out = os.path.join(SITE, "public", "media", "fusion")
        os.makedirs(out, exist_ok=True)
        name = slug(app.activeDocument.name.split(" v")[0])
        root = design.rootComponent

        exporter = design.exportManager
        exporter.execute(exporter.createC3MFExportOptions(root, os.path.join(out, name + ".3mf")))

        render(app, os.path.join(out, name + "-iso.png"), adsk.core.ViewOrientations.IsoTopRightViewOrientation)
        render(app, os.path.join(out, name + "-top.png"), adsk.core.ViewOrientations.TopViewOrientation)

        box = root.boundingBox
        size_mm = [round((box.maxPoint.x - box.minPoint.x) * 10, 1), round((box.maxPoint.y - box.minPoint.y) * 10, 1), round((box.maxPoint.z - box.minPoint.z) * 10, 1)]
        components = [c for c in design.allComponents if c != root]
        facts = {
            "name": app.activeDocument.name,
            "components": len(components),
            "componentNames": [c.name for c in components],
            "bodies": sum(c.bRepBodies.count for c in design.allComponents),
            "sizeMm": size_mm,
        }
        with open(os.path.join(out, name + ".json"), "w") as f:
            json.dump(facts, f, indent=2)

        ui.messageBox(
            "Exported {} to public/media/fusion.\n{} components, {} bodies, {} x {} x {} mm.".format(
                facts["name"], facts["components"], facts["bodies"], *size_mm
            )
        )
    except Exception:
        ui.messageBox("Export failed:\n{}".format(traceback.format_exc()))
