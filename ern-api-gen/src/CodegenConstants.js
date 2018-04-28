/**
 * A class for storing constants that are used throughout the project.
 */
export default class CodegenConstants {}
CodegenConstants.API_PACKAGE = 'apiPackage'
CodegenConstants.API_PACKAGE_DESC = 'package for generated api classes'
CodegenConstants.MODEL_PACKAGE = 'modelPackage'
CodegenConstants.MODEL_PACKAGE_DESC = 'package for generated models'
CodegenConstants.TEMPLATE_DIR = 'templateDir'
CodegenConstants.INVOKER_PACKAGE = 'invokerPackage'
CodegenConstants.INVOKER_PACKAGE_DESC = 'root package for generated code'
CodegenConstants.GROUP_ID = 'groupId'
CodegenConstants.GROUP_ID_DESC = 'groupId in generated pom.xml'
CodegenConstants.ARTIFACT_ID = 'artifactId'
CodegenConstants.ARTIFACT_ID_DESC = 'artifactId in generated pom.xml'
CodegenConstants.ARTIFACT_VERSION = 'artifactVersion'
CodegenConstants.ARTIFACT_VERSION_DESC = 'artifact version in generated pom.xml'
CodegenConstants.SOURCE_FOLDER = 'sourceFolder'
CodegenConstants.SOURCE_FOLDER_DESC = 'source folder for generated code'
CodegenConstants.IMPL_FOLDER = 'implFolder'
CodegenConstants.IMPL_FOLDER_DESC = 'folder for generated implementation code'
CodegenConstants.LOCAL_VARIABLE_PREFIX = 'localVariablePrefix'
CodegenConstants.LOCAL_VARIABLE_PREFIX_DESC =
  'prefix for generated code members and local variables'
CodegenConstants.SERIALIZABLE_MODEL = 'serializableModel'
CodegenConstants.SERIALIZABLE_MODEL_DESC =
  'boolean - toggle "implements Serializable" for generated models'
CodegenConstants.SERIALIZE_BIG_DECIMAL_AS_STRING = 'bigDecimalAsString'
CodegenConstants.SERIALIZE_BIG_DECIMAL_AS_STRING_DESC =
  'Treat BigDecimal values as Strings to avoid precision loss.'
CodegenConstants.LIBRARY = 'library'
CodegenConstants.LIBRARY_DESC = 'library template (sub-template)'
CodegenConstants.SORT_PARAMS_BY_REQUIRED_FLAG = 'sortParamsByRequiredFlag'
CodegenConstants.SORT_PARAMS_BY_REQUIRED_FLAG_DESC =
  'Sort method arguments to place required parameters before optional parameters.'
CodegenConstants.USE_DATETIME_OFFSET = 'useDateTimeOffset'
CodegenConstants.USE_DATETIME_OFFSET_DESC =
  'Use DateTimeOffset to model date-time properties'
CodegenConstants.ENSURE_UNIQUE_PARAMS = 'ensureUniqueParams'
CodegenConstants.ENSURE_UNIQUE_PARAMS_DESC =
  'Whether to ensure parameter names are unique in an operation (rename parameters that are not).'
CodegenConstants.PACKAGE_NAME = 'packageName'
CodegenConstants.PACKAGE_VERSION = 'packageVersion'
CodegenConstants.PACKAGE_TITLE = 'packageTitle'
CodegenConstants.PACKAGE_TITLE_DESC =
  'Specifies an AssemblyTitle for the .NET Framework global assembly attributes stored in the AssemblyInfo file.'
CodegenConstants.PACKAGE_PRODUCTNAME = 'packageProductName'
CodegenConstants.PACKAGE_PRODUCTNAME_DESC =
  'Specifies an AssemblyProduct for the .NET Framework global assembly attributes stored in the AssemblyInfo file.'
CodegenConstants.PACKAGE_DESCRIPTION = 'packageDescription'
CodegenConstants.PACKAGE_DESCRIPTION_DESC =
  'Specifies a AssemblyDescription for the .NET Framework global assembly attributes stored in the AssemblyInfo file.'
CodegenConstants.PACKAGE_COMPANY = 'packageCompany'
CodegenConstants.PACKAGE_COMPANY_DESC =
  'Specifies an AssemblyCompany for the .NET Framework global assembly attributes stored in the AssemblyInfo file.'
CodegenConstants.PACKAGE_COPYRIGHT = 'packageCopyright'
CodegenConstants.PACKAGE_COPYRIGHT_DESC =
  'Specifies an AssemblyCopyright for the .NET Framework global assembly attributes stored in the AssemblyInfo file.'
CodegenConstants.POD_VERSION = 'podVersion'
CodegenConstants.OPTIONAL_METHOD_ARGUMENT = 'optionalMethodArgument'
CodegenConstants.OPTIONAL_METHOD_ARGUMENT_DESC =
  'Optional method argument, e.g. void square(int x=10) (.net 4.0+ only).'
CodegenConstants.OPTIONAL_ASSEMBLY_INFO = 'optionalAssemblyInfo'
CodegenConstants.OPTIONAL_ASSEMBLY_INFO_DESC = 'Generate AssemblyInfo.cs.'
CodegenConstants.USE_COLLECTION = 'useCollection'
CodegenConstants.USE_COLLECTION_DESC =
  'Deserialize array types to Collection<T> instead of List<T>.'
CodegenConstants.RETURN_ICOLLECTION = 'returnICollection'
CodegenConstants.RETURN_ICOLLECTION_DESC =
  'Return ICollection<T> instead of the concrete type.'
CodegenConstants.OPTIONAL_PROJECT_FILE = 'optionalProjectFile'
CodegenConstants.OPTIONAL_PROJECT_FILE_DESC = 'Generate {PackageName}.csproj.'
CodegenConstants.OPTIONAL_PROJECT_GUID = 'packageGuid'
CodegenConstants.OPTIONAL_PROJECT_GUID_DESC =
  'The GUID that will be associated with the C# project'
CodegenConstants.MODEL_PROPERTY_NAMING = 'modelPropertyNaming'
CodegenConstants.MODEL_PROPERTY_NAMING_DESC =
  "Naming convention for the property: 'camelCase', 'PascalCase', 'snake_case' and 'original', which keeps the original name"
CodegenConstants.DOTNET_FRAMEWORK = 'targetFramework'
CodegenConstants.DOTNET_FRAMEWORK_DESC = 'The target .NET framework version.'
CodegenConstants.MODEL_NAME_PREFIX = 'modelNamePrefix'
CodegenConstants.MODEL_NAME_PREFIX_DESC =
  'Prefix that will be prepended to all model names. Default is the empty string.'
CodegenConstants.MODEL_NAME_SUFFIX = 'modelNameSuffix'
CodegenConstants.MODEL_NAME_SUFFIX_DESC =
  'Suffix that will be appended to all model names. Default is the empty string.'
CodegenConstants.OPTIONAL_EMIT_DEFAULT_VALUES = 'optionalEmitDefaultValues'
CodegenConstants.OPTIONAL_EMIT_DEFAULT_VALUES_DESC =
  "Set DataMember's EmitDefaultValue."
CodegenConstants.GIT_USER_ID = 'gitUserId'
CodegenConstants.GIT_USER_ID_DESC = 'Git user ID, e.g. swagger-api.'
CodegenConstants.GIT_REPO_ID = 'gitRepoId'
CodegenConstants.GIT_REPO_ID_DESC = 'Git repo ID, e.g. swagger-codegen.'
CodegenConstants.RELEASE_NOTE = 'releaseNote'
CodegenConstants.RELEASE_NOTE_DESC = "Release note, default to 'Minor update'."
CodegenConstants.HTTP_USER_AGENT = 'httpUserAgent'
CodegenConstants.HTTP_USER_AGENT_DESC =
  "HTTP user agent, e.g. codegen_csharp_api_client, default to 'Swagger-Codegen/{packageVersion}}/{language}'"
CodegenConstants.SUPPORTS_ES6 = 'supportsES6'
CodegenConstants.SUPPORTS_ES6_DESC = 'Generate code that conforms to ES6.'
CodegenConstants.EXCLUDE_TESTS = 'excludeTests'
CodegenConstants.EXCLUDE_TESTS_DESC =
  'Specifies that no tests are to be generated.'
CodegenConstants.GENERATE_API_TESTS = 'generateApiTests'
CodegenConstants.GENERATE_API_TESTS_DESC =
  'Specifies that api tests are to be generated.'
CodegenConstants.GENERATE_MODEL_TESTS = 'generateModelTests'
CodegenConstants.GENERATE_MODEL_TESTS_DESC =
  'Specifies that model tests are to be generated.'
CodegenConstants.MODEL_PROPERTY_NAMING_TYPE = {
  camelCase: 0,
  PascalCase: 1,
  snake_case: 2,
  original: 3,
}
