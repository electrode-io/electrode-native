/* tslint:disable:object-literal-sort-keys */
/**
 * A class for storing constants that are used throughout the project.
 */
export default class CodegenConstants {
  public static readonly API_PACKAGE = 'apiPackage';
  public static readonly API_PACKAGE_DESC = 'package for generated api classes';
  public static readonly MODEL_PACKAGE = 'modelPackage';
  public static readonly MODEL_PACKAGE_DESC = 'package for generated models';
  public static readonly TEMPLATE_DIR = 'templateDir';
  public static readonly INVOKER_PACKAGE = 'invokerPackage';
  public static readonly INVOKER_PACKAGE_DESC =
    'root package for generated code';
  public static readonly GROUP_ID = 'groupId';
  public static readonly GROUP_ID_DESC = 'groupId in generated pom.xml';
  public static readonly ARTIFACT_ID = 'artifactId';
  public static readonly ARTIFACT_ID_DESC = 'artifactId in generated pom.xml';
  public static readonly ARTIFACT_VERSION = 'artifactVersion';
  public static readonly ARTIFACT_VERSION_DESC =
    'artifact version in generated pom.xml';
  public static readonly SOURCE_FOLDER = 'sourceFolder';
  public static readonly SOURCE_FOLDER_DESC =
    'source folder for generated code';
  public static readonly IMPL_FOLDER = 'implFolder';
  public static readonly IMPL_FOLDER_DESC =
    'folder for generated implementation code';
  public static readonly LOCAL_VARIABLE_PREFIX = 'localVariablePrefix';
  public static readonly LOCAL_VARIABLE_PREFIX_DESC =
    'prefix for generated code members and local variables';
  public static readonly SERIALIZABLE_MODEL = 'serializableModel';
  public static readonly SERIALIZABLE_MODEL_DESC =
    'boolean - toggle "implements Serializable" for generated models';
  public static readonly SERIALIZE_BIG_DECIMAL_AS_STRING = 'bigDecimalAsString';
  public static readonly SERIALIZE_BIG_DECIMAL_AS_STRING_DESC =
    'Treat BigDecimal values as Strings to avoid precision loss.';
  public static readonly LIBRARY = 'library';
  public static readonly LIBRARY_DESC = 'library template (sub-template)';
  public static readonly SORT_PARAMS_BY_REQUIRED_FLAG =
    'sortParamsByRequiredFlag';
  public static readonly SORT_PARAMS_BY_REQUIRED_FLAG_DESC =
    'Sort method arguments to place required parameters before optional parameters.';
  public static readonly USE_DATETIME_OFFSET = 'useDateTimeOffset';
  public static readonly USE_DATETIME_OFFSET_DESC =
    'Use DateTimeOffset to model date-time properties';
  public static readonly ENSURE_UNIQUE_PARAMS = 'ensureUniqueParams';
  public static readonly ENSURE_UNIQUE_PARAMS_DESC =
    'Whether to ensure parameter names are unique in an operation (rename parameters that are not).';
  public static readonly PACKAGE_NAME = 'packageName';
  public static readonly PACKAGE_VERSION = 'packageVersion';
  public static readonly PACKAGE_TITLE = 'packageTitle';
  public static readonly PACKAGE_TITLE_DESC =
    'Specifies an AssemblyTitle for the .NET Framework global assembly attributes stored in the AssemblyInfo file.';
  public static readonly PACKAGE_PRODUCTNAME = 'packageProductName';
  public static readonly PACKAGE_PRODUCTNAME_DESC =
    'Specifies an AssemblyProduct for the .NET Framework global assembly attributes stored in the AssemblyInfo file.';
  public static readonly PACKAGE_DESCRIPTION = 'packageDescription';
  public static readonly PACKAGE_DESCRIPTION_DESC =
    'Specifies a AssemblyDescription for the .NET Framework global assembly attributes stored in the AssemblyInfo file.';
  public static readonly PACKAGE_COMPANY = 'packageCompany';
  public static readonly PACKAGE_COMPANY_DESC =
    'Specifies an AssemblyCompany for the .NET Framework global assembly attributes stored in the AssemblyInfo file.';
  public static readonly PACKAGE_COPYRIGHT = 'packageCopyright';
  public static readonly PACKAGE_COPYRIGHT_DESC =
    'Specifies an AssemblyCopyright for the .NET Framework global assembly attributes stored in the AssemblyInfo file.';
  public static readonly POD_VERSION = 'podVersion';
  public static readonly OPTIONAL_METHOD_ARGUMENT = 'optionalMethodArgument';
  public static readonly OPTIONAL_METHOD_ARGUMENT_DESC =
    'Optional method argument, e.g. void square(int x=10) (.net 4.0+ only).';
  public static readonly OPTIONAL_ASSEMBLY_INFO = 'optionalAssemblyInfo';
  public static readonly OPTIONAL_ASSEMBLY_INFO_DESC =
    'Generate AssemblyInfo.cs.';
  public static readonly USE_COLLECTION = 'useCollection';
  public static readonly USE_COLLECTION_DESC =
    'Deserialize array types to Collection<T> instead of List<T>.';
  public static readonly RETURN_ICOLLECTION = 'returnICollection';
  public static readonly RETURN_ICOLLECTION_DESC =
    'Return ICollection<T> instead of the concrete type.';
  public static readonly OPTIONAL_PROJECT_FILE = 'optionalProjectFile';
  public static readonly OPTIONAL_PROJECT_FILE_DESC =
    'Generate {PackageName}.csproj.';
  public static readonly OPTIONAL_PROJECT_GUID = 'packageGuid';
  public static readonly OPTIONAL_PROJECT_GUID_DESC =
    'The GUID that will be associated with the C# project';
  public static readonly MODEL_PROPERTY_NAMING = 'modelPropertyNaming';
  public static readonly MODEL_PROPERTY_NAMING_DESC =
    "Naming convention for the property: 'camelCase', 'PascalCase', 'snake_case' and 'original', which keeps the original name";
  public static readonly DOTNET_FRAMEWORK = 'targetFramework';
  public static readonly DOTNET_FRAMEWORK_DESC =
    'The target .NET framework version.';
  public static readonly MODEL_NAME_PREFIX = 'modelNamePrefix';
  public static readonly MODEL_NAME_PREFIX_DESC =
    'Prefix that will be prepended to all model names. Default is the empty string.';
  public static readonly MODEL_NAME_SUFFIX = 'modelNameSuffix';
  public static readonly MODEL_NAME_SUFFIX_DESC =
    'Suffix that will be appended to all model names. Default is the empty string.';
  public static readonly OPTIONAL_EMIT_DEFAULT_VALUES =
    'optionalEmitDefaultValues';
  public static readonly OPTIONAL_EMIT_DEFAULT_VALUES_DESC =
    "Set DataMember's EmitDefaultValue.";
  public static readonly GIT_USER_ID = 'gitUserId';
  public static readonly GIT_USER_ID_DESC = 'Git user ID, e.g. swagger-api.';
  public static readonly GIT_REPO_ID = 'gitRepoId';
  public static readonly GIT_REPO_ID_DESC =
    'Git repo ID, e.g. swagger-codegen.';
  public static readonly RELEASE_NOTE = 'releaseNote';
  public static readonly RELEASE_NOTE_DESC =
    "Release note, default to 'Minor update'.";
  public static readonly HTTP_USER_AGENT = 'httpUserAgent';
  public static readonly HTTP_USER_AGENT_DESC =
    "HTTP user agent, e.g. codegen_csharp_api_client, default to 'Swagger-Codegen/{packageVersion}}/{language}'";
  public static readonly SUPPORTS_ES6 = 'supportsES6';
  public static readonly SUPPORTS_ES6_DESC =
    'Generate code that conforms to ES6.';
  public static readonly EXCLUDE_TESTS = 'excludeTests';
  public static readonly EXCLUDE_TESTS_DESC =
    'Specifies that no tests are to be generated.';
  public static readonly GENERATE_API_TESTS = 'generateApiTests';
  public static readonly GENERATE_API_TESTS_DESC =
    'Specifies that api tests are to be generated.';
  public static readonly GENERATE_MODEL_TESTS = 'generateModelTests';
  public static readonly GENERATE_MODEL_TESTS_DESC =
    'Specifies that model tests are to be generated.';
  public static readonly MODEL_PROPERTY_NAMING_TYPE = {
    camelCase: 0,
    PascalCase: 1,
    snake_case: 2,
    original: 3,
  };
}
