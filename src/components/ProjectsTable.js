import React, { useState } from 'react';
import MUIDataTable from 'mui-datatables';
import defaultTo from 'ramda/src/defaultTo';
import map from 'ramda/src/map';
import path from 'ramda/src/path';
import sort from 'ramda/src/sort';
import find from 'ramda/src/find';
import reverse from 'ramda/src/reverse';
import type from 'ramda/src/type';
import includes from 'ramda/src/includes';
import indexOf from 'ramda/src/indexOf';
import compose from 'ramda/src/compose';
import CircularProgress from '@material-ui/core/CircularProgress';
import withStyles from '@material-ui/core/styles/withStyles';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import BranchModal from './BranchModal';
import SchoolModal from './SchoolModal';
import ProjectModal from './ProjectModal';
import TeamModal from './TeamModal';
import ToolboxModal from './ToolboxModal';

const styles = theme => ({
    table: {
        minWidth: 500,
    },
    errorMessage: {
        backgroundColor: theme.palette.error.dark,
        margin: theme.spacing.unit,
    },
    errorProjectRow: {
        backgroundColor: theme.palette.error.light,
    }
});

const getActivePhase = (classroom) => find((phase) => !phase.finished)(classroom.phases || []);

const ProjectsTable = ({ classes, classroomsQuery }) => {
    const [branchDetail, setBranchDetail] = useState(null);
    const [schoolDetail, setSchoolDetail] = useState(null);
    const [projectDetail, setProjectDetail] = useState(null);
    const [teamDetail, setTeamDetail] = useState(null);
    const [toolboxDetail, setToolboxDetail] = useState(null);
    if (classroomsQuery.loading) return <CircularProgress />;
    if (classroomsQuery.error) return (
        <SnackbarContent
            className={classes.errorMessage}
            message="Načtení se nezdařilo"
        />
    );

    const options = {
        filterType: 'multiselect',
        selectableRows: 'none',
        fixedHeader: true,
        // search: false,
        download: false,
        print: false,
        filter: false,
        responsive: 'scroll',
        rowsPerPage: 1000,
        rowsPerPageOptions: [10, 50, 100, 200, 500, 1000],
        customSearch: (searchQuery, row, columns) => {
            const found = !!find((column) => {
                const columnIndex = indexOf(column)(row);
                if (columns[columnIndex].search) {
                    return columns[columnIndex].search(searchQuery, column);
                }
                if (type(column) === 'String') {
                    return !!includes(searchQuery)(column);
                }
                if (type(column) === 'Array') {
                    return !!find(includes(searchQuery))(column);
                }
                return false;
            })(row);
            return !!found;
        },
        onCellClick: (colData, colMetadata) => {
            const classroom = classroomsQuery.classrooms[colMetadata.dataIndex];
            switch (colMetadata.colIndex) {
                default:
                case 0:
                case 2:
                case 6:
                case 8:
                case 9:
                case 10:
                case 11:
                    setProjectDetail(classroom);
                    return;
                case 1:
                case 3:
                    setTeamDetail(classroom.team);
                    return;
                case 4:
                    setBranchDetail(classroom);
                    return;
                case 5:
                    setSchoolDetail(classroom);
                    return;
                case 7:
                    setToolboxDetail(classroom.toolboxOrder);
                    return;
            }
        },
        customSort: (data, colIndex, order) => {
            switch(colIndex) {
                case 0:
                case 2:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                case 10:
                    const sorted = sort((a, b) => a.data[colIndex].localeCompare(b.data[colIndex]), data);
                    if (order === 'asc') return sorted;
                    return reverse(sorted);
            }
            const sorted = sort((a, b) => {
                let intA = 0;
                let intB = 0;
                try {
                    intA = parseInt(a.data[colIndex], 10);
                    intA = isNaN(intA) ? 0 : intA;
                } catch (e) {
                    // nothing..
                }
                try {
                    intB = parseInt(b.data[colIndex], 10);
                    intB = isNaN(intB) ? 0 : intB;
                } catch (e) {
                    // nothing..
                }
                return intA - intB;
            }, data);
            if (order === 'asc') return sorted;
            return reverse(sorted);
        }
    };

    return (
        <React.Fragment>
            {branchDetail ? (
                <BranchModal classroom={branchDetail} onClose={() => setBranchDetail(null)} />
            ) : null}
            {schoolDetail ? (
                <SchoolModal classroom={schoolDetail} onClose={() => setSchoolDetail(null)} />
            ) : null}
            {projectDetail ? (
                <ProjectModal classroom={projectDetail} onClose={() => setProjectDetail(null)} />
            ) : null}
            {teamDetail ? (
                <TeamModal team={teamDetail} onClose={() => setTeamDetail(null)} />
            ) : null}
            {toolboxDetail ? (
                <ToolboxModal toolbox={toolboxDetail} onClose={() => setToolboxDetail(null)} />
            ) : null}
            <div style={{ width: '100%', height: '100%' }}>
                <MUIDataTable
                    columns={[
                        'Projekt',
                        {
                            name: 'Tým',
                            options: {
                                sort: false,
                                customBodyRender: (value) => (
                                    <div>
                                        {map((user) => (
                                        <React.Fragment key={user.id}>
                                            {user.activated ? `${user.firstname} ${user.lastname}` : user.email}<br />
                                        </React.Fragment>
                                    ))(value)}
                                    </div>
                                ),
                                search: (query, values) => {
                                    return !!find((user) => {
                                        const valueString =  user.activated ? `${user.firstname} ${user.lastname}` : user.email;
                                        return includes(query)(valueString);
                                    })(values)
                                },
                            },

                        },
                        'Stav projektu',
                        {
                            name: 'Region',
                            options: {
                                sort: false,
                                customBodyRender: (value) => (
                                    <div>
                                        {map((region) => (
                                            <React.Fragment>
                                                {region}<br />
                                            </React.Fragment>
                                        ))(value)}
                                    </div>
                                ),
                            }
                        },
                        'Pobočka',
                        'Škola',
                        'Pololetí',
                        'Toolbox',
                        'Název firmy',
                        'V čem děti podnikají',
                        'Výdělek použití',
                        'Výdělek (Kč)',
                    ]}
                    options={options}
                    data={map((classroom) => {
                        return [
                            path(['classroomName'])(classroom) || '-',
                            compose(
                                defaultTo([]),
                                path(['team', 'users']),
                            )(classroom),
                            getActivePhase(classroom) ? (
                                `${getActivePhase(classroom) ? getActivePhase(classroom).number : 1}/${classroom.phases.length}: ${getActivePhase(classroom) ? getActivePhase(classroom).name : '-'}`
                            ) : 'Dokončeno',
                            classroom.team.users.map((user) => user.region),
                            path(['branchAddress'])(classroom) || '-',
                            path(['schoolAddress'])(classroom) || '-',
                            path(['semester'])(classroom) ? `${path(['semester'])(classroom)}` : '-',
                            path(['toolboxOrder', 'state'])(classroom) || '-',
                            path(['companyName'])(classroom) || '-',
                            path(['businessDescription'])(classroom) || '-',
                            path(['businessPurpose'])(classroom) || '-',
                            path(['moneyGoalAmount'])(classroom) || '-',
                        ]
                    })(classroomsQuery.classrooms || [])}
                />
            </div>
            {/*
                <TableRow
                    key={classroom.id}
                    className={validateProject(classroom) ? classes.errorProjectRow : null}
                >
                </TableRow>>
            */}
        </React.Fragment>
    );
};

const classroomsQuery = graphql(gql`
    {
        classrooms {
            id
            classroomName
            schoolAddress
            directorName
            directorEmail
            directorPhone
            teacherName
            teacherPhone
            teacherEmail
            schoolMeeting
            semester
            branchAddress
            branchRepresentativeEmail
            branchRepresentativePhone
            branchRepresentativeName
            toolboxOrder {
                id
                state
                recipient
                address
                childrenCount
            }
            phases {
                id
                name
                finished
                finishDate
                number
            }
            companyName
            businessPurpose
            businessDescription
            moneyGoalAmount
            team {
                id
                users {
                    id
                    firstname
                    lastname
                    activated
                    email
                    region
                }
            }
        }
    }
`, {
    name: 'classroomsQuery',
    options: {
        fetchPolicy: 'network-only',
    }
});

export default compose(
    withStyles(styles),
    classroomsQuery,
)(ProjectsTable);
