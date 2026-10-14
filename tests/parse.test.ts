import { describe, expect, it } from "vitest";
import { layoutNewArtboards, parseAgentOutput, parseStreaming } from "@/lib/agent/parse";

const SAMPLE = `Here you go.

<artboard title="Hero" kind="html" width="1440" height="900">
<!DOCTYPE html><html><body><h1>Hi</h1></body></html>
</artboard>

<file path="tokens.css">:root{--a:1}</file>
<resolve-comment id="cmt-hero"/>
`;

describe("agent output parser", () => {
  it("extracts artboards, files, and resolve markers", () => {
    const parsed = parseAgentOutput(SAMPLE);
    expect(parsed.artboards).toHaveLength(1);
    expect(parsed.artboards[0].title).toBe("Hero");
    expect(parsed.artboards[0].width).toBe(1440);
    expect(parsed.files[0].path).toBe("tokens.css");
    expect(parsed.resolveCommentIds).toEqual(["cmt-hero"]);
    expect(parsed.prose).toContain("Here you go");
    expect(parsed.prose).not.toContain("<artboard");
  });

  it("streams an unclosed artboard", () => {
    const partial = `<artboard title="In flight" kind="html" width="800" height="600">\n<html><body>partial`;
    const parsed = parseStreaming(partial);
    expect(parsed.artboards).toHaveLength(1);
    expect(parsed.artboards[0].title).toBe("In flight");
    expect(parsed.artboards[0].source).toContain("partial");
  });

  it("extracts dc-write and dc-set-props", () => {
    const parsed = parseAgentOutput(`
<dc-write path="A.dc.html" title="A" mount="false"><html></html></dc-write>
<dc-set-props path="A.dc.html">{"x":1}</dc-set-props>
`);
    expect(parsed.dcWrites[0].mount).toBe(false);
    expect(parsed.dcSetProps[0].props.x).toBe(1);
  });

  it("lays out new boards to the right of existing ones", () => {
    const pos = layoutNewArtboards(
      [{ x: 80, y: 80, width: 1000 }],
      [
        { title: "A", kind: "html", width: 400, height: 300, source: "" },
        { title: "B", kind: "html", width: 400, height: 300, source: "" },
      ],
    );
    expect(pos[0].x).toBe(1160);
    expect(pos[1].x).toBe(1640);
  });
});
