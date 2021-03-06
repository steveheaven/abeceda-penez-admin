import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import path from 'ramda/src/path';
import pathOr from 'ramda/src/pathOr';
import prop from 'ramda/src/prop';
import Layout from '../components/Layout';
import classroomAttributes from '../constants/classroomAttributes';
import ProjectsTable from '../components/ProjectsTable';

const CoreRegionProjects = ({ match, regionClassroomsQuery }) => {
    return (
        <Layout title={`Třídy z regionu ${path(['params', 'region'])(match)}`}>
            <ProjectsTable
                query={regionClassroomsQuery}
                dataSelector={prop('regionClassrooms')}
            />
        </Layout>
    );
};

const coreRegionClassrooms = graphql(gql`
    query RegionClassrooms($region: String!){
        regionClassrooms(region: $region) {
            ${classroomAttributes}
        }
    }
`, {
    name: 'regionClassroomsQuery',
    options: (props) => ({
        fetchPolicy: 'cache-and-network',
        variables: {
            region: pathOr('-', ['match', 'params', 'region'])(props)
        }
    })
});

export default coreRegionClassrooms(CoreRegionProjects);
