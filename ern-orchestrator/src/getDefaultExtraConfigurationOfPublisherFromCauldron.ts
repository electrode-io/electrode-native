import { AnyAppDescriptor } from 'ern-core';

export function getDefaultExtraConfigurationOfPublisherFromCauldron({
  publisherFromCauldron,
  napDescriptor,
}: {
  publisherFromCauldron: any;
  napDescriptor: AnyAppDescriptor;
}): any {
  if (
    publisherFromCauldron.name === 'maven' ||
    publisherFromCauldron.name.startsWith('maven@')
  ) {
    return {
      artifactId: `${napDescriptor.name}-ern-container`,
      groupId: 'com.walmartlabs.ern',
      mavenPassword: publisherFromCauldron.mavenPassword,
      mavenUser: publisherFromCauldron.mavenUser,
    };
  } else if (
    publisherFromCauldron.name === 'jcenter' ||
    publisherFromCauldron.name.startsWith('jcenter@')
  ) {
    return {
      artifactId: `${napDescriptor.name}-ern-container`,
      groupId: 'com.walmartlabs.ern',
    };
  }
}
