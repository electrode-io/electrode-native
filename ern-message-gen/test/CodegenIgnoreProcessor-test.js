import ernUtilDev from "@walmart/ern-util-dev";
import {assert} from "chai";
import CodegenIgnoreProcessor from "../src/ignore/CodegenIgnoreProcessor";
import fs from "fs";
import File from "../src/java/File";

describe('CodegenIgnoreProcessor', function () {

    const {compare, runBefore, cwd, runAfter} = ernUtilDev(__dirname);

    beforeEach(runBefore);
    afterEach(runAfter);

    function runTest(file, ignoreDefinition) {
        //capture
        let allowed;
        let invalid = false;
        const f = function () {
            const outputDir = cwd('.');

            fs.writeFileSync(cwd(".swagger-codegen-ignore"), ignoreDefinition, "utf8");
            const f = new File(cwd(file));
            f.getParentFile().mkdirs();
            fs.writeFileSync(f.getPath(), "", "utf8");
            let processor;
            try {
                processor = new CodegenIgnoreProcessor(outputDir);
            } catch (e) {
                if (invalid) {
                    expect(e).to.exist;
                } else {
                    expect(e).to.not.exist;
                }

            }
            const actual = processor.allowsFile(file);

            // Assert
            assert(actual === allowed, `${file} with definition "${ignoreDefinition}" to be ${allowed ? 'allowed' : 'ignored'}`);
        };
        f.ignored = function () {
            allowed = false;
            return f;
        };
        f.allowed = function () {
            allowed = true;
            return f;
        };
        f.invalid = function () {
            invalid = true;
            return f;
        };
        return f;
    }

    describe('Matching', function () {
        it("A file when matching should ignore.", runTest("build.sh", "build.sh").ignored());
        it("A file when matching nested files should ignore.", runTest("src/build.sh", "**/build.sh").ignored());
        it("A file when non-matching should allow.", runTest("Build.sh", "build.sh").allowed());
        it("A rooted file when matching should ignore.", runTest("build.sh", "/build.sh",).ignored());
        it("A rooted file definition when non-matching should allow.", runTest("nested/build.sh", "/build.sh").allowed());
        it("A file when matching exactly should ignore.", runTest("src/IO.Swagger.Test/Model/AnimalFarmTests.cs", "src/IO.Swagger.Test/Model/AnimalFarmTests.cs").ignored());
    });
    describe('Matching spaces in filenames', function () {
        it("A file when matching nested files with spaces in the name should ignore.", runTest("src/properly escaped.txt", "**/properly escaped.txt").ignored());
        it("A file when matching nested files with spaces in the name (improperly escaped rule) should allow.", runTest("src/improperly escaped.txt", "**/improperly\\ escaped.txt").allowed());
    });

    describe('Match All', function () {
        it("A recursive file (0 level) when matching should ignore.", runTest("docs/somefile.md", "docs/**").ignored());
        it("A recursive file (1 level) when matching should ignore.", runTest("docs/1/somefile.md", "docs/**",).ignored());
        it("A recursive file (n level) when matching should ignore.", runTest("docs/1/2/3/somefile.md", "docs/**",).ignored());
    });

    describe('Match Any', function () {
        it("A recursive file with match-any extension when matching should ignore.", runTest("docs/1/2/3/somefile.md", "docs/**/somefile.*").ignored());
        it("A recursive file with match-any file name when matching should ignore.", runTest("docs/1/2/3/somefile.java", "docs/**/*.java").ignored());
        it("A recursive file with match-any file name when matching should ignore.", runTest("docs/1/2/3/4/somefile.md", "docs/**/*").ignored());
        it("A recursive file with match-any extension when non-matching should allow.", runTest("docs/1/2/3/4/5/somefile.md", "docs/**/anyfile.*").allowed());
    });
    describe('Directory matches', function () {
        it("A directory rule when matching should be ignored.", runTest("docs/1/Users/a", "docs/**/Users/").ignored());
        it("A directory rule when non-matching should be allowed.", runTest("docs/1/Users1/a", "docs/**/Users/").allowed());
    });

    describe('Negation of excluded recursive files', function () {
        it("A pattern negating a previous ignore FILE rule should be allowed.", runTest("docs/UserApi.md", "docs/**\n!docs/UserApi.md").allowed());
    });
    describe('Negation of excluded directories', function () {
        it("A pattern negating a previous ignore DIRECTORY rule should be ignored.", runTest("docs/1/Users/UserApi.md", "docs/**/Users/\n!docs/1/Users/UserApi.md").ignored());
    });
    describe('Other matches which may not be parsed for correctness, but are free because of PathMatcher', function () {
        it("A file when matching against simple regex patterns when matching should be ignored.", runTest("docs/1/2/3/Some99File.md", "**/*[0-9]*").ignored());
        it("A file when matching against grouped subpatterns for extension when matching (md) should be ignored.", runTest("docs/1/2/3/SomeFile.md", "**/*.{java,md}").ignored());
        it("A file when matching against grouped subpatterns for extension when matching (java) should be ignored.", runTest("docs/1/2/3/SomeFile.java", "**/*.{java,md}").ignored());
        it("A file when matching against grouped subpatterns for extension when non-matching should be allowed.", runTest("docs/1/2/3/SomeFile.txt", "**/*.{java,md}").allowed());

        it("A file when matching against required single-character extension when matching should be ignored.", runTest("docs/1/2/3/foo.c", "**/*.?").ignored());
        it("A file when matching against required single-character extension when non-matching should be allowed.", runTest("docs/1/2/3/foo.cc", "**/*.?").allowed());
    });
    describe('Invalid', function () {
        it('. is invalid', runTest('what', '.').allowed());
        it('! is invalid', runTest('what', '!').allowed());
        it('.. is invalid', runTest('what', '..').allowed());

    })
});